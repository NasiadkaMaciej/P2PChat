"use client";

import { updateConnectionState } from './state-service';
import { setDataChannel, handleDataChannelMessage } from './message-service';
import { useUserName } from './user-service';

let peerConnection = null;
let dataChannel = null;

/**
 * Fetch ICE servers from the backend
 * @returns {Promise<{iceServers: Array}>} Promise resolving to an object with iceServers array
 */
function fetchIceServers() {
	return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/ice-servers`)
		.then(response => response.json())
		.then(config => {
			console.log('Retrieved ICE servers:', config);

			// Get selected server IDs from localStorage
			const selectedIds = JSON.parse(localStorage.getItem('selectedIceServers') || '[]');

			// Filter to only use selected servers or all if none selected
			let servers = config.iceServers;
			if (selectedIds.length > 0) {
				servers = servers.filter(server => selectedIds.includes(server._id));
			}

			// Format for RTCPeerConnection
			const iceServers = servers.map(server => ({
				urls: server.urls,
				username: server.username,
				credential: server.credential
			}));

			if (iceServers.length === 0) {
				console.warn('No ICE servers configured! Connections may fail.');
			}

			return { iceServers };
		});
}

/**
 * Create and configure WebRTC peer connection
 */
export function createPeerConnection() {
	return fetchIceServers()
		.then(({ iceServers }) => {
			if (peerConnection) closeConnection();

			// Separate STUN and TURN servers
			const stunServers = iceServers.filter(server =>
				server.type === 'stun' || (server.urls && server.urls.startsWith('stun:'))
			);
			const turnServers = iceServers.filter(server =>
				server.type === 'turn' || (server.urls && server.urls.startsWith('turn:'))
			);

			console.log(`Using ${stunServers.length} STUN servers and ${turnServers.length} TURN servers`);

			// Initial connection with STUN servers only
			peerConnection = new RTCPeerConnection({
				iceServers: stunServers,
				iceTransportPolicy: 'all'
			});

			// Track STUN connection progress
			let hasFoundDirectRoute = false;
			let stunTimeout = null;

			// Set up connection state change handler
			peerConnection.onconnectionstatechange = () => {
				console.log(`Connection state changed: ${peerConnection.connectionState}`);
				updateConnectionState(peerConnection.connectionState);

				// If connection is established, clear the STUN timeout
				if (peerConnection.connectionState === 'connected') {
					if (stunTimeout) {
						clearTimeout(stunTimeout);
						stunTimeout = null;
					}
					hasFoundDirectRoute = true;
				}
			};

			// Handle ICE candidate events
			peerConnection.onicecandidate = event => {
				if (event.candidate) {
					console.log('New ICE candidate:', event.candidate);

					// Log the type of ICE candidate (host, srflx, relay)
					const candidateStr = event.candidate.candidate || "";
					if (candidateStr.includes("typ relay")) {
						console.log("Connection is using TURN (relay) server.");
					} else if (candidateStr.includes("typ srflx")) {
						console.log("Connection is using STUN (server reflexive) server.");
						hasFoundDirectRoute = true;
					} else if (candidateStr.includes("typ host")) {
						console.log("Connection is using local (host) candidate.");
						hasFoundDirectRoute = true;
					}

					// The actual sending of ICE candidates happens in signaling-service
					// via the window event system
					window.dispatchEvent(new CustomEvent('ice-candidate', {
						detail: {
							candidate: event.candidate,
							peerId: findRemotePeerId()
						}
					}));
				}
			};

			// Handle ICE connection state changes
			peerConnection.oniceconnectionstatechange = () => {
				console.log(`ICE connection state: ${peerConnection.iceConnectionState}`);

				// If ICE gathering is complete and we haven't found a direct route,
				// and we're not already connected, try with TURN servers
				if (peerConnection.iceConnectionState === 'failed' && !hasFoundDirectRoute && turnServers.length > 0) {
					console.log('STUN connection failed, adding TURN servers...');

					// Add TURN servers to the existing configuration
					turnServers.forEach(server => {
						try {
							peerConnection.addIceServer(server);
							console.log(`Added TURN server: ${server.urls}`);
						} catch (error) {
							console.error('Error adding TURN server:', error);
						}
					});
				}
			};

			// Set a timeout to add TURN servers if STUN is taking too long
			stunTimeout = setTimeout(() => {
				if (!hasFoundDirectRoute && peerConnection.iceConnectionState !== 'connected'
					&& peerConnection.iceConnectionState !== 'completed') {
					console.log('STUN connection timeout, adding TURN servers...');

					// Add TURN servers after timeout
					turnServers.forEach(server => {
						try {
							peerConnection.addIceServer(server);
							console.log(`Added TURN server: ${server.urls}`);
						} catch (error) {
							console.error('Error adding TURN server:', error);

							// As fallback, restart ICE with all servers if adding fails
							if (peerConnection.restartIce) {
								console.log('Restarting ICE with all servers');
								peerConnection.setConfiguration({ iceServers: [...stunServers, ...turnServers] });
								peerConnection.restartIce();
							}
						}
					});
				}
			}, 5000); // 5 second timeout for STUN-only connection attempt

			// Handle incoming data channel
			peerConnection.ondatachannel = event => {
				console.log('Received data channel');
				setupDataChannel(event.channel);
			};

			return peerConnection;
		})
		.catch(error => {
			console.error('Error creating peer connection:', error);
			return null;
		});
}

/**
 * Helper function to find the remote peer ID based on connection state
 */
function findRemotePeerId() {
	if (window._currentRemotePeer)
		return window._currentRemotePeer;
	return null;
}

/**
 * Close connection
 */
export function closeConnection() {
	if (dataChannel) {
		dataChannel.close();
		dataChannel = null;
	}

	if (peerConnection) {
		peerConnection.close();
		peerConnection = null;
	}

	updateConnectionState('disconnected');
}

/**
 * Set up the data channel
 */
export function setupDataChannel(channel) {
	dataChannel = channel;

	// Set the data channel in message service
	setDataChannel(dataChannel);

	channel.onopen = () => {
		console.log('Data channel opened');
		updateConnectionState('connected');

		// Send a join message
		const userName = useUserName();
		if (userName) {
			const joinMsg = `${userName} joined the chat`;
			channel.send(JSON.stringify({
				id: Date.now().toString(36),
				sender: 'system',
				content: joinMsg,
				timestamp: Date.now()
			}));
		}
	};

	channel.onclose = () => {
		console.log('Data channel closed');
		updateConnectionState('disconnected');
	};

	channel.onmessage = handleDataChannelMessage;

	return channel;
}

/**
 * Get the current peer connection
 */
export function getPeerConnection() {
	return peerConnection;
}