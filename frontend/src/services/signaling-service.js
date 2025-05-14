"use client";

import { registerWithDht, findPeersFromDht, checkForSignals } from './dht-service';
import { createPeerConnection, getPeerConnection, setupDataChannel } from './connection-service';
import { waitForIceGatheringComplete } from './webrtc-service';

let dhtService = null;
let dhtPeerId = null;
let iceCandidateBuffer = [];
let signalCheckInterval = null;

/**
 * Common setup for peer connections
 */
async function setupPeerConnection(isInitiator = false) {
	// Clear ICE candidate buffer on new connections
	iceCandidateBuffer = [];

	// Create and initialize peer connection
	const pc = await createPeerConnection();
	if (!pc) throw new Error("Failed to create peer connection");

	// Set up data channel if initiator
	if (isInitiator) {
		const dc = pc.createDataChannel('chat');
		setupDataChannel(dc);
	}

	return pc;
}

/**
 * Common function for handling SDP (offer/answer)
 */
async function handleSessionDescription(sdpPayload, isOffer = false) {
	try {
		console.log(`Processing ${isOffer ? 'offer' : 'answer'}:`, sdpPayload);

		// Use a single parsing approach
		const sessionDesc = typeof sdpPayload === 'string'
			? JSON.parse(sdpPayload)
			: sdpPayload;

		if (!sessionDesc?.type || !sessionDesc?.sdp) {
			throw new Error(`Invalid ${isOffer ? 'offer' : 'answer'} format - missing type or sdp`);
		}

		const pc = getPeerConnection();
		if (!pc) throw new Error("No active peer connection");

		await pc.setRemoteDescription(new RTCSessionDescription(sessionDesc));
		console.log("Remote description set successfully");

		// Process any buffered ICE candidates
		await processBufferedIceCandidates();

		return true;
	} catch (error) {
		console.error(`Error handling ${isOffer ? 'offer' : 'answer'}:`, error);
		throw error;
	}
}

/**
 * Process signal through DHT
 */
async function sendSignalViaDht(signal, targetPeerId) {
	if (!dhtService?.url || !dhtPeerId) {
		throw new Error("Not connected to a DHT service");
	}

	await fetch(`${dhtService.url}/signal`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from: dhtPeerId,
			to: targetPeerId,
			type: signal.type,
			payload: JSON.stringify(signal.payload)
		})
	});
}

/**
 * Connect via DHT
 */
export async function connectViaDht(selectedDht) {
	if (!selectedDht?.url) throw new Error("No DHT service selected");

	dhtService = selectedDht;
	console.log("Connecting to DHT:", selectedDht.url);

	try {
		// Register our peer with the DHT
		const registration = await registerWithDht(selectedDht.url);
		dhtPeerId = registration.peerId;

		// Find peers through the DHT
		const peers = await findPeersFromDht(selectedDht.url);
		const otherPeers = peers.filter(p => p.peerId !== dhtPeerId);

		// Start polling for signals
		startSignalPolling(selectedDht.url, dhtPeerId);

		// Set up event listener for ICE candidates
		window.addEventListener('ice-candidate', handleIceCandidateEvent);

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
		sendSignalViaDht({ type: 'ice-candidate', payload: candidate }, peerId);
	}
}

/**
 * Helper function to start signal polling
 */
function startSignalPolling(dhtUrl, peerId) {
	if (signalCheckInterval) clearInterval(signalCheckInterval);

	signalCheckInterval = setInterval(async () => {
		try {
			const signals = await checkForSignals(dhtUrl, peerId);
			if (signals?.length > 0) {
				console.log("Received signals:", signals);
				handleIncomingSignals(signals, dhtUrl, peerId);
			}
		} catch (error) {
			console.error("Error checking for signals:", error);
		}
	}, 2000);
}

/**
 * Connect to a specific peer via DHT
 */
export async function connectToPeerViaDht(peerId, dhtUrl) {
	if (!dhtService || !dhtPeerId) throw new Error("Not connected to a DHT service");

	// Store the remote peer ID
	window._currentRemotePeer = peerId;

	try {
		console.log(`Creating connection to peer: ${peerId}`);

		// Create peer connection
		const pc = await setupPeerConnection(true);

		// Create offer
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);
		const completeOffer = await waitForIceGatheringComplete(pc);

		// Send offer through DHT
		await sendSignalViaDht({ type: 'offer', payload: completeOffer }, peerId);

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

	try {
		// Create and initialize peer connection
		const pc = await setupPeerConnection();

		// Store the remote peer ID
		window._currentRemotePeer = fromPeerId;

		// Parse offer if needed
		let offerSdp = offerPayload;
		try {
			if (typeof offerPayload === 'string') {
				offerSdp = JSON.parse(offerPayload);
			}
		} catch (e) {
			console.error("Error parsing offer payload:", e);
			throw new Error("Invalid offer format");
		}

		// Set remote description
		console.log('Setting remote description from offer');
		await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));

		// Create answer
		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);

		// Wait for ICE gathering to complete
		const completeAnswer = await waitForIceGatheringComplete(pc);

		// Send answer via DHT
		await sendSignalViaDht({ type: 'answer', payload: completeAnswer }, fromPeerId);

		console.log('Answer sent successfully');

		// Process buffered ICE candidates
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

	// Group signals by type
	const signalsByType = signals.reduce((acc, signal) => {
		if (!acc[signal.type]) acc[signal.type] = [];
		acc[signal.type].push(signal);
		return acc;
	}, {});

	// Buffer ICE candidates
	if (signalsByType['ice-candidate']) {
		iceCandidateBuffer.push(...signalsByType['ice-candidate']);
		console.log(`Buffered ${signalsByType['ice-candidate'].length} ICE candidates`);
	}

	const pc = getPeerConnection();

	// Handle offer
	if (signalsByType.offer?.[0]) {
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
	if (signalsByType.answer?.[0] && pc) {
		try {
			const answerSignal = signalsByType.answer[0];
			await handleSessionDescription(answerSignal.payload, false);
			window.dispatchEvent(new CustomEvent('peer-connection-established', {
				detail: { peerId: answerSignal.from }
			}));
		} catch (error) {
			console.error("Error processing answer signal:", error);
		}
	}

	// Process ICE candidates if ready
	if (pc?.remoteDescription) {
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
}

/**
 * Handle incoming answer
 */
export async function handleAnswer(answerPayload) {
	return handleSessionDescription(answerPayload, false);
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