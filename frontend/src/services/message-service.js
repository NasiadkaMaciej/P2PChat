"use client";

import { useUserName } from './user-service';

// Reference to the data channel from connection-service
let dataChannel = null;

/**
 * Set data channel reference
 */
export function setDataChannel(channel) {
	dataChannel = channel;
}

/**
 * Send message with username and unique ID
 */
export function sendMessage(message) {
	if (!dataChannel || dataChannel.readyState !== 'open') {
		console.error("Cannot send message - data channel not open");
		return false;
	}

	try {
		const messageData = {
			id: generateMessageId(),
			sender: useUserName(),
			content: message,
			timestamp: Date.now()
		};

		dataChannel.send(JSON.stringify(messageData));

		// Emit event for local display
		window.dispatchEvent(new CustomEvent('p2p-message', {
			detail: JSON.stringify(messageData)
		}));

		return true;
	} catch (error) {
		console.error("Error sending message:", error);
		return false;
	}
}

/**
 * Subscribe to messages
 */
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

	return () => {
		window.removeEventListener('p2p-message', messageHandler);
	};
}

/**
 * Handle incoming data channel messages
 */
export function handleDataChannelMessage(event) {
	try {
		// Dispatch the message event for subscribers
		window.dispatchEvent(new CustomEvent('p2p-message', {
			detail: event.data
		}));
	} catch (error) {
		console.error("Error handling message:", error);
	}
}

/**
 * Generate a unique message ID
 */
function generateMessageId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}