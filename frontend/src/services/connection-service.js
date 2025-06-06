"use client";

import { updateConnectionState } from './state-service';
import { setDataChannel, handleDataChannelMessage } from './message-service';
import { useUserName } from './user-service';
import { fetchSelected } from './api-service';

let peerConnection = null;
let dataChannel = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 30;
let lastIceConfig = null;
let pendingReconnect = false;

/**
 * Fetch ICE servers from the backend
 */
function fetchIceServers() {
	return fetchSelected('/api/ice-servers')
		.then(selectedServers => {
			console.log('Retrieved selected ICE servers:', selectedServers);

			// Format for RTCPeerConnection
			const iceServers = selectedServers.map(server => ({
				urls: server.url,
				username: server.username,
				credential: server.credential
			}));

			if (iceServers.length === 0) {
				console.warn('No ICE servers selected! Connections may fail.');
			}

			lastIceConfig = { iceServers };
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

			reconnectAttempts = 0;
			pendingReconnect = false;

			// Clear any buffered ICE candidates from previous connections
			if (window.clearIceCandidateBuffer && typeof window.clearIceCandidateBuffer === 'function')
				window.clearIceCandidateBuffer();

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
				iceTransportPolicy: 'all',
				iceCandidatePoolSize: 10,
				bundlePolicy: 'max-bundle',
				rtcpMuxPolicy: 'require'
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

					// Reset reconnect attempts on successful connection
					reconnectAttempts = 0;
				}
				else if (peerConnection.connectionState === 'disconnected' ||
					peerConnection.connectionState === 'failed') {

					// Attempt reconnection for transient issues
					if (!pendingReconnect) {
						pendingReconnect = true;
						attemptReconnection();
					}
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

					// Update the entire configuration instead of trying to add individual servers
					try {
						// Get current servers and add TURN servers
						const currentConfig = peerConnection.getConfiguration();
						const updatedIceServers = [...currentConfig.iceServers, ...turnServers];

						// Set the updated configuration
						peerConnection.setConfiguration({
							...currentConfig,
							iceServers: updatedIceServers
						});

						console.log(`Added ${turnServers.length} TURN servers to configuration`);

						// Try to restart ICE
						if (peerConnection.restartIce) peerConnection.restartIce();
					} catch (error) {
						console.error('Error updating ICE servers:', error);
					}
				}

				if (peerConnection.iceConnectionState === 'disconnected' ||
					peerConnection.iceConnectionState === 'failed') {
					if (!pendingReconnect) {
						pendingReconnect = true;
						attemptReconnection();
					}
				}
			};

			// Set a timeout to add TURN servers if STUN is taking too long
			stunTimeout = setTimeout(() => {
				if (!hasFoundDirectRoute && peerConnection.iceConnectionState !== 'connected'
					&& peerConnection.iceConnectionState !== 'completed') {
					console.log('STUN connection timeout, adding TURN servers...');

					// Update configuration with TURN servers
					try {
						const currentConfig = peerConnection.getConfiguration();
						const updatedIceServers = [...currentConfig.iceServers, ...turnServers];

						peerConnection.setConfiguration({
							...currentConfig,
							iceServers: updatedIceServers
						});

						console.log(`Added ${turnServers.length} TURN servers after timeout`);

						// Try to restart ICE
						if (peerConnection.restartIce)
							peerConnection.restartIce();
					} catch (error) {
						console.error('Error updating ICE servers configuration:', error);
					}
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
 * Attempt to recover connection
 */
function attemptReconnection() {
	if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
		console.error('Max reconnection attempts reached, giving up');
		updateConnectionState('failed');
		pendingReconnect = false;
		return;
	}

	reconnectAttempts++;
	console.log(`Attempting reconnection (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

	// Try to restart ICE if possible
	if (peerConnection && peerConnection.restartIce) {
		console.log('Restarting ICE connection...');
		peerConnection.restartIce();

		// Reset the timer to check if reconnect succeeded
		setTimeout(() => {
			if (peerConnection &&
				(peerConnection.connectionState !== 'connected' &&
					peerConnection.iceConnectionState !== 'connected')) {

				console.log('ICE restart failed, attempting full reconnect');
				triggerFullReconnect();
			} else {
				pendingReconnect = false;
			}
		}, 5000);
	} else {
		// If ICE restart not available, do full reconnect
		triggerFullReconnect();
	}
}

/**
 * Trigger a full reconnection
 */
function triggerFullReconnect() {
	if (!lastIceConfig) {
		pendingReconnect = false;
		return;
	}

	// Dispatch event to request reconnection at the signaling level
	window.dispatchEvent(new CustomEvent('request-reconnection', {
		detail: {
			remotePeerId: findRemotePeerId(),
			attempt: reconnectAttempts
		}
	}));

	// Reset pending state after a delay - either the reconnect succeeds or we'll try again
	setTimeout(() => {
		pendingReconnect = false;
	}, 5000);
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

	// Import and use the cleanup function
	import('./message-service').then(messageService => {
		messageService.cleanupTorrents();
	}).catch(err => {
		console.error('Error cleaning up torrents:', err);
	});

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

	channel.onerror = (error) => {
		console.error('Data channel error:', error);

		// Try to reconnect on errors
		if (!pendingReconnect) {
			pendingReconnect = true;
			attemptReconnection();
		}
	};

	channel.onmessage = (event) => {
		try {
			// Pre-process heartbeats
			if (typeof event.data === 'string') {
				const data = JSON.parse(event.data);
				if (data.type === 'heartbeat') {
					// Respond to heartbeats with a pong
					channel.send(JSON.stringify({
						type: 'heartbeat-ack',
						timestamp: data.timestamp,
						responseTime: Date.now()
					}));
					return;
				}
				else if (data.type === 'heartbeat-ack') {
					// Calculate round-trip time
					const rtt = Date.now() - data.timestamp;
					console.log(`Heartbeat RTT: ${rtt}ms`);
					return;
				}
			}

			// Forward all other messages to message handler
			handleDataChannelMessage(event);
		} catch (error) {
			console.error('Error in data channel message handler:', error);
		}
	};

	return channel;
}

/**
 * Get the current peer connection
 */
export function getPeerConnection() {
	return peerConnection;
}

/**
 * Check if connected
 */
export function isConnected() {
	return dataChannel && dataChannel.readyState === 'open';
}