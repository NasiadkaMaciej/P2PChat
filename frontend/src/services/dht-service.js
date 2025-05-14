import { fetchAll, addRecord, editRecord, deleteRecord } from './api-service';
import { useUserName } from './user-service';

const LOCAL_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Backend API methods for DHT service management
 */
export const fetchDhtServices = async () => {
	return fetchAll('/api/dht-services');
};

export const addDhtService = async (name, url, port) => {
	const finalUrl = formatUrlWithPort(url, port);
	return addRecord('/api/dht-services', { name, url: finalUrl });
};

export const editDhtService = async (id, name, url, port) => {
	const finalUrl = formatUrlWithPort(url, port);
	return editRecord('/api/dht-services', id, { name, url: finalUrl });
};

export const deleteDhtService = async (id) => {
	return deleteRecord('/api/dht-services', id);
};

/**
 * DHT server communication methods
 */
export const registerWithDht = async (dhtUrl) => {
	try {
		const timestamp = Date.now();
		const peerId = `user-${timestamp}-${useUserName()}`;

		const response = await fetch(`${dhtUrl}/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				peerId,
				name: useUserName(),
				lastSeen: timestamp
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Failed to register with DHT service: ${errorText}`);
		}

		return await response.json();
	} catch (error) {
		console.error('Error registering with DHT:', error);
		throw error;
	}
};

export const findPeersFromDht = async (dhtUrl) => {
	try {
		const response = await fetch(`${dhtUrl}/peers`);
		if (!response.ok) throw new Error('Failed to fetch peers from DHT service');
		return await response.json();
	} catch (error) {
		console.error('Error finding peers from DHT:', error);
		throw error;
	}
};

export const checkForSignals = async (dhtUrl, peerId) => {
	try {
		const response = await fetch(`${dhtUrl}/signal/${peerId}`);
		if (!response.ok) throw new Error('Failed to check signals');
		return await response.json();
	} catch (error) {
		console.error('Error checking signals:', error);
		throw error;
	}
};

/**
 * Helper functions
 */
function formatUrlWithPort(url, port) {
	if (!port) return url;

	if (url.includes('://')) {
		// Handle URLs with protocol (http://, https://, wss://, etc.)
		return `${url.split(':').slice(0, 2).join(':')}:${port}`;
	}

	// Handle URLs without protocol
	return `${url}:${port}`;
}