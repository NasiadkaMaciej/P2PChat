"use client";

import { updateConnectionState } from './state-service';
import { setDataChannel, handleDataChannelMessage } from './message-service';
import { useUserName } from './user-service';

let peerConnection = null;
let dataChannel = null;

/**
 * Create and configure WebRTC peer connection
 */
export function createPeerConnection() {
	// Get ICE servers
	return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/ice-servers`)
		.then(response => response.json())
		.then(config => {
			console.log('Retrieved ICE servers:', config);

			// Extract the iceServers array from the config object
			const { iceServers } = config;

			// Close any existing connections
			if (peerConnection) closeConnection();

			// Create RTCPeerConnection with the iceServers array
			peerConnection = new RTCPeerConnection({ iceServers });

			// Set up connection state change handler
			peerConnection.onconnectionstatechange = () => {
				console.log(`Connection state changed: ${peerConnection.connectionState}`);
				updateConnectionState(peerConnection.connectionState);
			};

			// Handle ICE candidate events
			peerConnection.onicecandidate = event => {
				if (event.candidate) {
					console.log('New ICE candidate:', event.candidate);
					// The actual sending of ICE candidates happens in signaling-service
					// via the window event system
					if (typeof window !== 'undefined') {
						window.dispatchEvent(new CustomEvent('ice-candidate', {
							detail: {
								candidate: event.candidate,
								peerId: findRemotePeerId()
							}
						}));
					}
				}
			};

			// Handle incoming data channel
			peerConnection.ondatachannel = event => {
				console.log('Received data channel');
				setupDataChannel(event.channel);
			};

			// Make peerConnection globally available for debugging and service coordination
			if (typeof window !== 'undefined') window._peerConnection = peerConnection;

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
	if (typeof window !== 'undefined' && window._currentRemotePeer)
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