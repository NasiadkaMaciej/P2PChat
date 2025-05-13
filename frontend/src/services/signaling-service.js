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

		// Store peerId globally for other services to use
		if (typeof window !== 'undefined') {
			window._ownPeerId = dhtPeerId;
		}

		// Find peers through the DHT
		const peers = await findPeersFromDht(selectedDht.url);

		// Filter out our own peer ID
		const otherPeers = peers.filter(p => p.peerId !== dhtPeerId);

		// Start polling for signals (for incoming connection requests)
		startSignalPolling(selectedDht.url, dhtPeerId);

		// Set up event listener for ICE candidates
		if (typeof window !== 'undefined') {
			window.addEventListener('ice-candidate', handleIceCandidateEvent);
		}

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

	// Store interval ID for cleanup
	if (typeof window !== 'undefined') {
		window._signalCheckInterval = signalCheckInterval;
	}
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
	if (typeof window !== 'undefined') {
		window._currentRemotePeer = peerId;
	}

	// Create peer connection
	const pc = await createPeerConnection();
	if (!pc) throw new Error("Failed to create connection");

	// Create data channel
	const dc = pc.createDataChannel('chat');
	setupDataChannel(dc);

	try {
		// Create offer
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);
		const completeOffer = await waitForIceGatheringComplete(pc);

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
	if (!dhtService || !dhtPeerId) {
		throw new Error("Not connected to a DHT service");
	}

	// Store the remote peer ID
	if (typeof window !== 'undefined') {
		window._currentRemotePeer = fromPeerId;
	}

	try {
		// Parse the offer
		const offer = JSON.parse(offerPayload);

		// Create peer connection
		const pc = await createPeerConnection();
		if (!pc) throw new Error("Failed to create connection");

		// Set remote description (the offer)
		await pc.setRemoteDescription(new RTCSessionDescription(offer));

		// Now that remote description is set, process any buffered ICE candidates
		await processBufferedIceCandidates();

		// Create answer
		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);

		// Wait for ICE gathering to complete
		const completeAnswer = await waitForIceGatheringComplete(pc);

		// Send answer through DHT
		await fetch(`${dhtUrl}/signal`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				from: dhtPeerId,
				to: fromPeerId,
				type: 'answer',
				payload: JSON.stringify(completeAnswer)
			})
		});

		console.log("Answer sent via DHT");
		return true;
	} catch (error) {
		console.error("Error accepting incoming connection:", error);
		throw error;
	}
}

/**
 * Handle incoming signals
 */
async function handleIncomingSignals(signals, dhtUrl, peerId) {
	if (!signals || signals.length === 0) return;

	// Store all ICE candidates in the buffer for now
	const iceCandidates = signals.filter(s => s.type === 'ice-candidate');
	if (iceCandidates.length > 0) {
		iceCandidateBuffer.push(...iceCandidates);
		console.log(`Buffered ${iceCandidates.length} ICE candidates, total in buffer: ${iceCandidateBuffer.length}`);
	}

	// Process the first offer signal
	const offerSignal = signals.find(s => s.type === 'offer');
	if (offerSignal) {
		// Store the remote peer ID
		if (typeof window !== 'undefined') {
			window._currentRemotePeer = offerSignal.from;
		}

		// Emit an event that a connection request was received
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new CustomEvent('peer-connection-request', {
				detail: {
					from: offerSignal.from,
					type: 'offer',
					payload: offerSignal.payload
				}
			}));
		}
	}

	// Process answer signals
	const answerSignal = signals.find(s => s.type === 'answer');
	if (answerSignal && getPeerConnection()) {
		try {
			console.log("Processing answer signal from:", answerSignal.from);
			const answerSdp = JSON.parse(answerSignal.payload);
			await getPeerConnection().setRemoteDescription(new RTCSessionDescription(answerSdp));
			console.log("Remote description set successfully");

			// Process any buffered ICE candidates now that remote description is set
			await processBufferedIceCandidates();

			// Emit an event that connection has been established
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('peer-connection-established', {
					detail: { peerId: answerSignal.from }
				}));
			}
		} catch (error) {
			console.error("Error processing answer signal:", error);
		}
	}

	// Clean up processed signals
	if (signals.length > 0) {
		try {
			await fetch(`${dhtUrl}/clear-signals/${peerId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					signalIds: signals.map(s => s.id)
				})
			});
			console.log(`Cleared ${signals.length} processed signals`);
		} catch (error) {
			console.error("Error clearing processed signals:", error);
		}
	}
}

/**
 * Process buffered ICE candidates
 */
async function processBufferedIceCandidates() {
	console.log(`Processing ${iceCandidateBuffer.length} buffered ICE candidates`);
	const pc = getPeerConnection();

	if (pc && pc.remoteDescription && iceCandidateBuffer.length > 0) {
		for (const iceSignal of iceCandidateBuffer) {
			try {
				const candidate = JSON.parse(iceSignal.payload);
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
				console.log("Successfully added buffered ICE candidate from:", iceSignal.from);
			} catch (error) {
				console.error("Error adding buffered ICE candidate:", error);
			}
		}

		// Clear buffer after processing
		iceCandidateBuffer = [];
	} else {
		console.log("Cannot process ICE candidates yet - no peer connection or remote description");
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

		// Check if the answer needs to be parsed
		let answer;
		if (typeof answerPayload === 'string') {
			try {
				// Try to parse it as JSON
				answer = JSON.parse(answerPayload);
			} catch (e) {
				console.error("Failed to parse answer payload:", e);
				throw new Error("Invalid answer format");
			}
		} else {
			// Already an object
			answer = answerPayload;
		}

		// Ensure answer has the correct format for RTCSessionDescription
		if (!answer || !answer.type || !answer.sdp) {
			console.error("Invalid answer format:", answer);
			throw new Error("Invalid answer format - missing type or sdp");
		}

		const pc = getPeerConnection();
		if (!pc) {
			throw new Error("No active peer connection");
		}

		// Create a proper RTCSessionDescription
		const remoteDesc = new RTCSessionDescription({
			type: answer.type,
			sdp: answer.sdp
		});

		// Set the remote description
		await pc.setRemoteDescription(remoteDesc);
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

	if (typeof window !== 'undefined') {
		window.removeEventListener('ice-candidate', handleIceCandidateEvent);
	}

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