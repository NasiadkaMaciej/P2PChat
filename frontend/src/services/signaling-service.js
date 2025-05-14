"use client";

import { registerWithDht, findPeersFromDht, checkForSignals } from './dht-service';
import { createPeerConnection, getPeerConnection, setupDataChannel } from './connection-service';
import { waitForIceGatheringComplete } from './webrtc-service';

let dhtService = null;
let dhtPeerId = null;
let iceCandidateBuffer = [];
let signalCheckInterval = null;

/**
 * Connect via DHT
 */
export async function connectViaDht(selectedDht) {
	if (!selectedDht || !selectedDht.url) {
		throw new Error("No DHT service selected");
	}

	iceCandidateBuffer = [];
	dhtService = selectedDht;
	console.log("Connecting to DHT:", selectedDht.url);

	try {
		// Register our peer with the DHT
		console.log("Registering with DHT...");
		const registration = await registerWithDht(selectedDht.url);
		console.log("DHT registration response:", registration);
		dhtPeerId = registration.peerId;

		// Find peers through the DHT
		const peers = await findPeersFromDht(selectedDht.url);

		// Filter out our own peer ID
		const otherPeers = peers.filter(p => p.peerId !== dhtPeerId);

		// Start polling for signals (for incoming connection requests)
		startSignalPolling(selectedDht.url, dhtPeerId);

		// Set up event listener for ICE candidates
		window.addEventListener('ice-candidate', handleIceCandidateEvent);

		// Return peer information
		return {
			status: 'connected_to_dht',
			peerId: dhtPeerId,
			availablePeers: otherPeers
		};
	} catch (error) {
		console.error("Error connecting to DHT:", error);
		throw error;
	}
}

/**
 * Handle ICE candidate events and send them via DHT
 */
function handleIceCandidateEvent(event) {
	const { candidate, peerId } = event.detail;
	if (candidate && peerId && dhtService) {
		sendIceCandidateViaDht(candidate, peerId);
	}
}

/**
 * Helper function to start signal polling
 */
function startSignalPolling(dhtUrl, peerId) {
	// Clear any existing interval
	if (signalCheckInterval) {
		clearInterval(signalCheckInterval);
	}

	signalCheckInterval = setInterval(async () => {
		try {
			const signals = await checkForSignals(dhtUrl, peerId);
			if (signals && signals.length > 0) {
				console.log("Received signals:", signals);
				handleIncomingSignals(signals, dhtUrl, peerId);
			}
		} catch (error) {
			console.error("Error checking for signals:", error);
		}
	}, 2000);

	return signalCheckInterval;
}

/**
 * Connect to a specific peer via DHT
 */
export async function connectToPeerViaDht(peerId, dhtUrl) {
	if (!dhtService || !dhtPeerId) {
		throw new Error("Not connected to a DHT service");
	}

	iceCandidateBuffer = [];

	// Store the remote peer ID
	window._currentRemotePeer = peerId;

	try {
		console.log(`Creating connection to peer: ${peerId}`);

		// Create peer connection
		const pc = await createPeerConnection();
		if (!pc) throw new Error("Failed to create connection");

		// Create data channel
		const dc = pc.createDataChannel('chat');
		setupDataChannel(dc);

		// Create offer
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);
		const completeOffer = await waitForIceGatheringComplete(pc);

		console.log(`Sending offer to peer: ${peerId}`);

		// Send offer through DHT signaling
		await fetch(`${dhtUrl}/signal`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: dhtPeerId,
				to: peerId,
				type: 'offer',
				payload: JSON.stringify(completeOffer)
			})
		});

		return { status: 'connecting', targetPeerId: peerId };
	} catch (error) {
		console.error("Error creating offer via DHT:", error);
		throw error;
	}
}

/**
 * Accept incoming connection
 */
export async function acceptIncomingConnection(offerPayload, dhtUrl, fromPeerId) {
	console.log('Accepting connection from:', fromPeerId);

	// Clear ICE candidate buffer on new connections
	iceCandidateBuffer = [];

	try {
		// Create and initialize peer connection
		const pc = await createPeerConnection();
		if (!pc) throw new Error("Failed to create peer connection");

		// Store the remote peer ID for later use
		window._currentRemotePeer = fromPeerId;

		// Set remote description from the offer
		let offerSdp;
		try {
			// Try to parse if it's a JSON string
			offerSdp = typeof offerPayload === 'string' ?
				JSON.parse(offerPayload) : offerPayload;
		} catch (e) {
			console.error("Error parsing offer payload:", e);
			throw new Error("Invalid offer format");
		}

		console.log('Setting remote description from offer');
		await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

		// Create and set local description (answer)
		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);

		// Wait for ICE gathering to complete
		const completeAnswer = await waitForIceGatheringComplete(pc);

		// Send answer back through DHT
		const response = await fetch(`${dhtUrl}/signal`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: dhtPeerId,
				to: fromPeerId,
				type: 'answer',
				payload: JSON.stringify(completeAnswer)
			})
		});

		console.log('Answer sent successfully');

		// Now that the connection is established, process any buffered ICE candidates
		await processBufferedIceCandidates();

		return { status: 'connecting', targetPeerId: fromPeerId };
	} catch (error) {
		console.error('Error accepting incoming connection:', error);
		throw error;
	}
}

/**
 * Handle incoming signals
 */
async function handleIncomingSignals(signals, dhtUrl, peerId) {
	if (!signals || signals.length === 0) return;

	// Group signals by type for simpler processing
	const signalsByType = signals.reduce((acc, signal) => {
		if (!acc[signal.type]) acc[signal.type] = [];
		acc[signal.type].push(signal);
		return acc;
	}, {});

	// Buffer ICE candidates for later processing
	if (signalsByType['ice-candidate']) {
		iceCandidateBuffer.push(...signalsByType['ice-candidate']);
		console.log(`Buffered ${signalsByType['ice-candidate'].length} ICE candidates`);
	}

	// Process offer/answer signals first
	const pc = getPeerConnection();

	// Handle offer - highest priority
	if (signalsByType.offer && signalsByType.offer[0]) {
		const offerSignal = signalsByType.offer[0];
		window._currentRemotePeer = offerSignal.from;
		window.dispatchEvent(new CustomEvent('peer-connection-request', {
			detail: {
				from: offerSignal.from,
				type: 'offer',
				payload: offerSignal.payload
			}
		}));
	}

	// Handle answer
	if (signalsByType.answer && signalsByType.answer[0] && pc) {
		try {
			const answerSignal = signalsByType.answer[0];
			const answerSdp = JSON.parse(answerSignal.payload);
			await pc.setRemoteDescription(new RTCSessionDescription(answerSdp));
			await processBufferedIceCandidates();
			window.dispatchEvent(new CustomEvent('peer-connection-established', {
				detail: { peerId: answerSignal.from }
			}));
		} catch (error) {
			console.error("Error processing answer signal:", error);
		}
	}

	// Process ICE candidates if we're ready
	if (pc && pc.remoteDescription) {
		await processBufferedIceCandidates();
	}
}

/**
 * Process buffered ICE candidates
 */
async function processBufferedIceCandidates() {
	const pc = getPeerConnection();
	if (!pc?.remoteDescription || iceCandidateBuffer.length === 0) return;

	console.log(`Processing ${iceCandidateBuffer.length} buffered ICE candidates`);

	const remainingCandidates = [];

	for (const signal of iceCandidateBuffer) {
		try {
			const candidate = JSON.parse(signal.payload);
			await pc.addIceCandidate(new RTCIceCandidate(candidate));
		} catch (error) {
			console.error("Error adding ICE candidate:", error);
			remainingCandidates.push(signal);
		}
	}

	iceCandidateBuffer = remainingCandidates;

	if (iceCandidateBuffer.length > 0) {
		console.warn(`${iceCandidateBuffer.length} ICE candidates failed to add. Will retry later.`);
	}
}

/**
 * Send ICE candidate through DHT
 */
async function sendIceCandidateViaDht(candidate, remotePeerId) {
	try {
		if (!dhtService || !dhtService.url) return;

		await fetch(`${dhtService.url}/signal`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: dhtPeerId,
				to: remotePeerId,
				type: 'ice-candidate',
				payload: JSON.stringify(candidate)
			})
		});
		console.log('ICE candidate sent via DHT');
	} catch (error) {
		console.error('Error sending ICE candidate:', error);
	}
}

/**
 * Handle incoming answer
 */
export async function handleAnswer(answerPayload) {
	try {
		console.log("Processing answer:", answerPayload);

		// Use a single parsing approach
		const answer = typeof answerPayload === 'string'
			? JSON.parse(answerPayload)
			: answerPayload;

		if (!answer?.type || !answer?.sdp) {
			throw new Error("Invalid answer format - missing type or sdp");
		}

		const pc = getPeerConnection();
		if (!pc) throw new Error("No active peer connection");

		await pc.setRemoteDescription(new RTCSessionDescription(answer));
		console.log("Remote description set successfully");

		return true;
	} catch (error) {
		console.error("Error accepting answer:", error);
		throw error;
	}
}

/**
 * Disconnect from DHT
 */
export function disconnectFromDht() {
	if (signalCheckInterval) {
		clearInterval(signalCheckInterval);
		signalCheckInterval = null;
	}

	window.removeEventListener('ice-candidate', handleIceCandidateEvent);

	dhtService = null;
	dhtPeerId = null;
	iceCandidateBuffer = [];
}

/**
 * Get the current DHT service
 */
export function getCurrentDhtService() {
	return dhtService;
}

/**
 * Get own DHT peer ID
 */
export function getOwnPeerId() {
	return dhtPeerId;
}