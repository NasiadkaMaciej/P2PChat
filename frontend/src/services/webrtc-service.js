"use client";

import { createPeerConnection, setupDataChannel, getPeerConnection } from './connection-service';

/**
 * Create an offer for a WebRTC connection
 */
export async function createOffer() {
	try {
		// Create peer connection
		const pc = await createPeerConnection();
		if (!pc) throw new Error("Failed to create connection");

		// Create data channel
		const dc = pc.createDataChannel('chat');
		setupDataChannel(dc);

		// Create and set local description (offer)
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		// Wait for ICE gathering to complete
		const completeOffer = await waitForIceGatheringComplete(pc);

		return JSON.stringify(completeOffer);
	} catch (error) {
		console.error('Error creating offer:', error);
		throw new Error(`Failed to create offer: ${error.message}`);
	}
}

/**
 * Accept an answer to establish a connection
 */
export async function acceptAnswer(answerString) {
	try {
		const answer = JSON.parse(answerString);
		const peerConnection = getPeerConnection();

		if (!peerConnection) {
			throw new Error('No active connection');
		}

		await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
		console.log('Remote description set successfully');

		return true;
	} catch (error) {
		console.error('Error accepting answer:', error);
		throw new Error(`Failed to accept answer: ${error.message}`);
	}
}

/**
 * Create an answer in response to an offer
 */
export async function createAnswer(offerString) {
	try {
		const offer = JSON.parse(offerString);

		// Create peer connection
		const pc = await createPeerConnection();
		if (!pc) throw new Error("Failed to create connection");

		// Set remote description (offer)
		await pc.setRemoteDescription(new RTCSessionDescription(offer));

		// Create and set local description (answer)
		const answer = await pc.createAnswer();
		await pc.setLocalDescription(answer);

		// Wait for ICE gathering to complete
		const completeAnswer = await waitForIceGatheringComplete(pc);

		return JSON.stringify(completeAnswer);
	} catch (error) {
		console.error('Error creating answer:', error);
		throw new Error(`Failed to create answer: ${error.message}`);
	}
}

/**
 * Wait for ICE gathering to complete
 */
export function waitForIceGatheringComplete(pc) {
	return new Promise(resolve => {
		if (pc.iceGatheringState === 'complete') {
			resolve(pc.localDescription);
			return;
		}

		const checkState = () => {
			if (pc.iceGatheringState === 'complete') {
				pc.removeEventListener('icegatheringstatechange', checkState);
				resolve(pc.localDescription);
			}
		};

		pc.addEventListener('icegatheringstatechange', checkState);

		// Timeout after 5 seconds
		setTimeout(() => {
			pc.removeEventListener('icegatheringstatechange', checkState);
			console.log('ICE gathering timed out, returning current description');
			resolve(pc.localDescription);
		}, 5000);
	});
}