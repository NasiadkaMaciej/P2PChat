"use client";
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
	window.global = window;
}

import { useUserName } from "./user-service";
// Import dynamically to ensure it only loads on client side
let WebTorrent = null;
if (typeof window !== 'undefined' && typeof global === 'undefined') {
	window.global = window;
}

// ToDO: MENU and constants
const trackerUrl = 'ws://torrent2.nasiadka.pl:32265';

let currentDataChannel = null;
let torrentClient = null;
let activeTorrents = {};
let iceServersConfig = [];

// Initialize WebTorrent on first use
async function getWebTorrentClient() {
	if (!torrentClient) {
		if (typeof window !== 'undefined' && !WebTorrent) {
			WebTorrent = (await import('webtorrent')).default;
		}

		if (!WebTorrent) {
			console.error('WebTorrent not available');
			return null;
		}

		try {
			// Fetch ICE servers configuration
			await fetchIceServersConfig();

			torrentClient = new WebTorrent({
				tracker: {
					announce: [trackerUrl],
					rtcConfig: {
						iceServers: iceServersConfig || [],
						sdpSemantics: 'unified-plan'
					},
					// Lower announce interval for faster peer discovery
					announceInterval: 1000, // 1 second (default is 30)
					// Increase number of peers to connect to
					maxConns: 55,
					// Enable DHT for faster peer discovery
					dht: true
				}
			});

			// Handle client errors
			torrentClient.on('error', err => {
				console.error('WebTorrent client error:', err);
			});
		} catch (error) {
			console.error('Error initializing WebTorrent client:', error);
			return null;
		}
	}
	return torrentClient;
}

// Fetch ICE servers configuration
async function fetchIceServersConfig() {
	try {
		const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/ice-servers`);
		const config = await response.json();

		// Get selected server IDs from localStorage
		const selectedIds = JSON.parse(localStorage.getItem('selectedIceServers') || '[]');

		// Filter to only use selected servers or all if none selected
		let servers = config.iceServers;
		if (selectedIds.length > 0) {
			servers = servers.filter(server => selectedIds.includes(server._id));
		}

		// Format for WebRTC usage
		iceServersConfig = servers.map(server => ({
			urls: server.urls,
			username: server.username,
			credential: server.credential
		}));

		console.log('WebTorrent using ICE servers:', iceServersConfig);
	} catch (error) {
		console.error('Error fetching ICE servers for WebTorrent:', error);
		iceServersConfig = []; // Use empty array as fallback
	}
}

export function setDataChannel(dataChannel) {
	currentDataChannel = dataChannel;
}

export function sendMessage(content) {
	if (!currentDataChannel || currentDataChannel.readyState !== 'open') {
		console.error('Data channel not open for sending messages');
		return false;
	}

	try {
		const message = {
			id: generateMessageId(),
			content,
			sender: useUserName(),
			timestamp: Date.now()
		};

		currentDataChannel.send(JSON.stringify(message));

		// Dispatch message event locally to display sent message
		window.dispatchEvent(new CustomEvent('p2p-message', {
			detail: JSON.stringify(message)
		}));

		return true;
	} catch (error) {
		console.error('Error sending message:', error);
		return false;
	}
}

export function subscribeToMessages(callback) {
	const messageHandler = (event) => {
		try {
			const messageData = JSON.parse(event.detail);
			callback((prevMessages) => [...prevMessages, messageData]);
		} catch (err) {
			console.error('Error parsing message:', err);
		}
	};

	window.addEventListener('p2p-message', messageHandler);
	return () => window.removeEventListener('p2p-message', messageHandler);
}

export async function sendFile(file) {
	if (!currentDataChannel || currentDataChannel.readyState !== 'open') {
		console.error('Data channel not open for sending files');
		return false;
	}

	const client = await getWebTorrentClient();
	if (!client) {
		console.error('WebTorrent client not available');
		return false;
	}
	const fileId = generateMessageId();
	const userName = useUserName();

	// Initial progress event
	dispatchProgressEvent('file-send-progress', {
		id: fileId,
		fileName: file.name,
		fileSize: file.size,
		transferred: 0,
		percent: 0
	});

	// We'll postpone creating the file message for the sender until confirmation

	try {
		// Throttle progress updates to prevent UI overload
		let lastProgressUpdate = 0;

		client.seed(file, { announce: [trackerUrl], store: WebTorrent.MEMORY_STORE }, torrent => {
			console.log('Created torrent:', torrent.infoHash);

			activeTorrents[fileId] = torrent;

			// Send torrent info to peer
			const meta = {
				id: fileId,
				type: 'webtorrent-file',
				fileName: file.name,
				fileSize: file.size,
				fileType: file.type,
				infoHash: torrent.infoHash,
				magnetURI: torrent.magnetURI,
				timestamp: Date.now(),
				sender: userName
			};

			currentDataChannel.send(JSON.stringify(meta));

			// Throttle progress updates to max 5 updates per second
			torrent.on('upload', () => {
				const now = Date.now();
				if (now - lastProgressUpdate > 200) { // 200ms = 5 updates per second
					lastProgressUpdate = now;
					const uploaded = torrent.uploaded;
					const percent = Math.min(100, Math.floor((uploaded / file.size) * 100));

					dispatchProgressEvent('file-send-progress', {
						id: fileId,
						fileName: file.name,
						fileSize: file.size,
						transferred: uploaded,
						percent: percent
					});
				}
			});

			torrent.on('done', () => {
				console.log('Upload complete for:', file.name);

				// Mark progress as complete
				dispatchProgressEvent('file-send-progress', {
					id: fileId,
					fileName: file.name,
					fileSize: file.size,
					transferred: file.size,
					percent: 100,
					complete: true
				});
			});
		});
	} catch (error) {
		console.error('Error creating torrent:', error);
		return false;
	}

	return true;
}

// Function to handle torrent completion
function handleTorrentComplete(fileId, torrent, meta, onComplete) {
	try {
		const torrentFile = torrent.files[0];
		if (typeof torrentFile.blob === 'function') {
			torrentFile.blob().then(blob => {
				const url = URL.createObjectURL(blob);
				createFileMessage(fileId, url, meta, onComplete);
			}).catch(err => {
				console.error('Error with blob method:', err);
				fallbackToStreamMethod(torrentFile, fileId, meta, onComplete);
			});
		} else {
			fallbackToStreamMethod(torrentFile, fileId, meta, onComplete);
		}
	} catch (error) {
		console.error('Error handling torrent completion:', error);
	}
}

// Fallback method using stream
function fallbackToStreamMethod(torrentFile, fileId, meta) {
	try {
		const chunks = [];
		torrentFile.createReadStream()
			.on('data', chunk => {
				chunks.push(chunk);
			})
			.on('end', () => {
				try {
					const blob = new Blob(chunks, { type: meta.fileType || 'application/octet-stream' });
					const url = URL.createObjectURL(blob);
					createAndDispatchFileMessage(fileId, url, meta);

					// Remove progress after a delay
					setTimeout(() => {
						dispatchProgressEvent('file-receive-complete', {
							id: fileId
						});
					}, 2000);
				} catch (err) {
					console.error('Error creating blob from chunks:', err);
				}
			})
			.on('error', err => {
				console.error('Error streaming file data:', err);
			});
	} catch (err) {
		console.error('Error in stream fallback method:', err);
	}
}

function createAndDispatchFileMessage(fileId, url, meta) {
	const fileMessage = {
		id: fileId,
		type: 'file',
		fileName: meta.fileName,
		fileSize: meta.fileSize,
		fileType: meta.fileType,
		url: url,
		sender: meta.sender,
		timestamp: meta.timestamp
	};

	window.dispatchEvent(new CustomEvent('p2p-message', {
		detail: JSON.stringify(fileMessage)
	}));
}

// Helper to create and dispatch the file message
function createFileMessage(fileId, url, meta, onComplete) {
	const fileMessage = {
		id: fileId,
		type: 'file',
		fileName: meta.fileName,
		fileSize: meta.fileSize,
		fileType: meta.fileType,
		url: url,
		sender: meta.sender,
		timestamp: meta.timestamp
	};

	window.dispatchEvent(new CustomEvent('p2p-message', {
		detail: JSON.stringify(fileMessage)
	}));

	if (typeof onComplete === 'function') onComplete();
}

function dispatchProgressEvent(eventName, data) {
	window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
}

// Handle data channel messages with improved file handling
export async function handleDataChannelMessage(event) {
	try {
		if (typeof event.data === 'string') {
			const data = JSON.parse(event.data);

			// Handle WebTorrent file metadata
			if (data.type === 'webtorrent-file') {
				const client = await getWebTorrentClient();
				if (!client) {
					console.error('WebTorrent client not available');
					return;
				}

				dispatchProgressEvent('file-receive-progress', {
					id: data.id,
					fileName: data.fileName,
					fileSize: data.fileSize,
					transferred: 0,
					percent: 0
				});

				// Throttle progress updates
				let lastProgressUpdate = 0;

				client.add(data.magnetURI, {
					announce: [trackerUrl],
					store: WebTorrent.MEMORY_STORE
				}, torrent => {
					activeTorrents[data.id] = torrent;

					torrent.on('download', () => {
						const now = Date.now();
						if (now - lastProgressUpdate > 200) { // 200ms = 5 updates per second
							lastProgressUpdate = now;
							const downloaded = torrent.downloaded;
							const percent = Math.min(100, Math.floor((downloaded / data.fileSize) * 100));

							dispatchProgressEvent('file-receive-progress', {
								id: data.id,
								fileName: data.fileName,
								fileSize: data.fileSize,
								transferred: downloaded,
								percent: percent
							});
						}
					});

					torrent.on('done', () => {
						console.log('Torrent download complete');

						// Mark progress as complete
						dispatchProgressEvent('file-receive-progress', {
							id: data.id,
							fileName: data.fileName,
							fileSize: data.fileSize,
							transferred: data.fileSize,
							percent: 100,
							complete: true
						});

						// Process the file immediately
						const torrentFile = torrent.files[0];
						try {
							// Using blob method with fallback
							if (typeof torrentFile.blob === 'function') {
								torrentFile.blob().then(blob => {
									const url = URL.createObjectURL(blob);
									createAndDispatchFileMessage(data.id, url, data);

									// Send acknowledgment to sender
									if (currentDataChannel && currentDataChannel.readyState === 'open') {
										currentDataChannel.send(JSON.stringify({
											type: 'file-received',
											id: data.id,
											fileName: data.fileName
										}));
									}

									// Remove progress after a delay
									setTimeout(() => {
										dispatchProgressEvent('file-receive-complete', {
											id: data.id
										});
									}, 1000);
								}).catch(err => {
									console.error('Error with blob method:', err);
									fallbackToStreamMethod(torrentFile, data.id, data);
								});
							} else {
								fallbackToStreamMethod(torrentFile, data.id, data);
							}
						} catch (error) {
							console.error('Error handling completed torrent:', error);
						}
					});
				});
				return;
			}
			else if (data.type === 'file-received' && data.id) {
				console.log('File receipt confirmed by receiver:', data.fileName);

				// Create the local file message for the sender now that we got confirmation
				const fileInTorrents = activeTorrents[data.id];
				if (fileInTorrents) {
					// Create a blob URL from the first file in the torrent
					const file = fileInTorrents.files[0];

					if (file) {
						if (typeof file.blob === 'function') {
							file.blob().then(blob => {
								const url = URL.createObjectURL(blob);
								// Dispatch the sender's file message
								const fileMessage = {
									id: data.id,
									type: 'file',
									fileName: file.name,
									fileSize: file.length,
									url: url,
									sender: useUserName(),
									timestamp: Date.now()
								};

								window.dispatchEvent(new CustomEvent('p2p-message', {
									detail: JSON.stringify(fileMessage)
								}));

								// Remove progress bar
								setTimeout(() => {
									dispatchProgressEvent('file-send-complete', {
										id: data.id
									});
								}, 500);
							});
						}
					}
				}
				return;
			}

			// Handle normal text messages
			window.dispatchEvent(new CustomEvent('p2p-message', {
				detail: event.data
			}));
		}
	} catch (error) {
		console.error("Error handling message:", error);
	}
}

// Clean up WebTorrent resources
export function cleanupTorrents() {
	if (torrentClient) {
		Object.values(activeTorrents).forEach(torrent => {
			torrent.destroy();
		});
		activeTorrents = {};
		torrentClient.destroy();
		torrentClient = null;
	}
}

function generateMessageId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}