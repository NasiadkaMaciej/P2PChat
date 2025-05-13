import { useUserName } from './user-service';

const LOCAL_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Fetch all available DHT services
export const fetchDhtServices = async () => {
	try {
		const response = await fetch(`${LOCAL_BACKEND_URL}/api/dht-services`);
		if (!response.ok) throw new Error('Failed to fetch DHT services');
		return await response.json();
	} catch (error) {
		console.error('Error fetching DHT services:', error);
		throw error;
	}
};

// Get signals for a specific peer
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

// Add a new DHT service
export const addDhtService = async (name, url, port) => {
	try {
		// Ensure the URL has a port if specified
		const finalUrl = port ?
			(url.includes('://') ?
				`${url.split(':').slice(0, 2).join(':')}:${port}` :
				`${url}:${port}`
			) : url;

		const response = await fetch(`${LOCAL_BACKEND_URL}/api/dht-services`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, url: finalUrl })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to add DHT service');
		}

		return await response.json();
	} catch (error) {
		console.error('Error adding DHT service:', error);
		throw error;
	}
};

// Delete a DHT service
export const deleteDhtService = async (id) => {
	try {
		const response = await fetch(`${LOCAL_BACKEND_URL}/api/dht-services/${id}`, {
			method: 'DELETE'
		});

		if (!response.ok) throw new Error('Failed to delete DHT service');
		return await response.json();
	} catch (error) {
		console.error('Error deleting DHT service:', error);
		throw error;
	}
};

// Register with a DHT service
export const registerWithDht = async (dhtUrl) => {
	const timestamp = Date.now();
	const peerId = `user-${timestamp}-${useUserName()}`;

	console.log(`Attempting to register with DHT at ${dhtUrl}`);

	try {
		const response = await fetch(`${dhtUrl}/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				peerId,
				name: useUserName(),
				lastSeen: timestamp
			})
		});

		console.log(`DHT registration response status: ${response.status}`);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`DHT registration failed: ${errorText}`);
			throw new Error('Failed to register with DHT service');
		}

		const result = await response.json();
		console.log(`DHT registration successful:`, result);
		return result;
	} catch (error) {
		console.error('Error registering with DHT:', error);
		throw error;
	}
};

// Find peers from a DHT service
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