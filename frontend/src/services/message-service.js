"use client";
import { useUserName } from "./user-service";

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
	return () => window.removeEventListener('p2p-message', messageHandler);
}

export function sendFile(file) {
	if (!currentDataChannel || currentDataChannel.readyState !== 'open') {
		console.error('Data channel not open for sending files');
		return false;
	}

	const chunkSize = 64 * 1024;
	const fileId = generateMessageId();
	const meta = {
		id: fileId,
		type: 'file-meta',
		fileName: file.name,
		fileSize: file.size,
		fileType: file.type,
		timestamp: Date.now(),
		totalChunks: Math.ceil(file.size / chunkSize),
		sender: useUserName()
	};

	// Initial progress event
	dispatchProgressEvent('file-send-progress', {
		id: fileId,
		fileName: file.name,
		fileSize: file.size,
		transferred: 0,
		percent: 0
	});

	// Send metadata first
	currentDataChannel.send(JSON.stringify(meta));

	const reader = new FileReader();
	reader.onload = (e) => {
		const buffer = e.target.result;
		let offset = 0;
		let sent = 0;

		// Function to send chunks with better flow control
		function sendNextChunk() {
			if (offset >= buffer.byteLength) {
				// All chunks sent - complete the process
				completeFileSend(fileId, file, meta);
				return;
			}

			const chunk = buffer.slice(offset, offset + chunkSize);
			currentDataChannel.send(chunk);

			offset += chunk.byteLength;
			sent += chunk.byteLength;

			// Update progress
			dispatchProgressEvent('file-send-progress', {
				id: fileId,
				fileName: meta.fileName,
				fileSize: meta.fileSize,
				transferred: sent,
				percent: Math.round((sent / file.size) * 100)
			});

			// Schedule next chunk with small delay
			setTimeout(sendNextChunk, 10);
		}

		// Start sending chunks
		sendNextChunk();
	};

	reader.readAsArrayBuffer(file);
	return true;
}

function completeFileSend(fileId, file, meta) {
	// Create file message for sender's UI
	const fileMessage = {
		id: fileId,
		type: 'file',
		fileName: file.name,
		fileSize: file.size,
		fileType: file.type,
		url: URL.createObjectURL(file),
		sender: meta.sender,
		timestamp: meta.timestamp
	};

	window.dispatchEvent(new CustomEvent('p2p-message', {
		detail: JSON.stringify(fileMessage)
	}));

	window.dispatchEvent(new CustomEvent('file-send-complete', {
		detail: { id: fileId }
	}));
}

function dispatchProgressEvent(eventName, data) {
	window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
}

// Receiving logic
let incomingFile = null;
let receivedChunks = [];
let expectedChunks = 0;
let receivedBytes = 0;

export function handleDataChannelMessage(event) {
	try {
		if (typeof event.data === 'string') {
			const data = JSON.parse(event.data);

			if (data.type === 'file-meta') {
				// Start receiving a new file
				incomingFile = data;
				receivedChunks = [];
				expectedChunks = data.totalChunks;
				receivedBytes = 0;

				// Initial progress notification
				dispatchProgressEvent('file-receive-progress', {
					id: data.id,
					fileName: data.fileName,
					fileSize: data.fileSize,
					transferred: 0,
					percent: 0
				});
				return;
			}

			// Normal text message
			window.dispatchEvent(new CustomEvent('p2p-message', {
				detail: event.data
			}));
		} else if (incomingFile) {
			// File chunk received
			receivedChunks.push(event.data);
			receivedBytes += event.data.byteLength || event.data.size || 0;

			// Update progress
			const percent = Math.round((receivedBytes / incomingFile.fileSize) * 100);
			dispatchProgressEvent('file-receive-progress', {
				id: incomingFile.id,
				fileName: incomingFile.fileName,
				fileSize: incomingFile.fileSize,
				transferred: receivedBytes,
				percent
			});

			// Check if all chunks received
			if (receivedChunks.length === expectedChunks) {
				completeFileReceive();
			}
		}
	} catch (error) {
		console.error("Error handling message:", error);
	}
}

function completeFileReceive() {
	const blob = new Blob(receivedChunks, { type: incomingFile.fileType });
	const fileMessage = {
		id: incomingFile.id,
		type: 'file',
		fileName: incomingFile.fileName,
		fileSize: incomingFile.fileSize,
		fileType: incomingFile.fileType,
		url: URL.createObjectURL(blob),
		sender: incomingFile.sender,
		timestamp: incomingFile.timestamp
	};

	window.dispatchEvent(new CustomEvent('p2p-message', {
		detail: JSON.stringify(fileMessage)
	}));

	window.dispatchEvent(new CustomEvent('file-receive-complete', {
		detail: { id: incomingFile.id }
	}));

	// Reset file receiving state
	incomingFile = null;
	receivedChunks = [];
	expectedChunks = 0;
	receivedBytes = 0;
}

function generateMessageId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}