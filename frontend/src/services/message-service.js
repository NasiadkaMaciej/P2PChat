"use client";
import { useUserName } from './user-service';

let currentDataChannel = null;

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

	return () => {
		window.removeEventListener('p2p-message', messageHandler);
	};
}

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

function generateMessageId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}