'use client';
import { useState, useEffect } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { findPeersFromDht } from '@/services/dht-service';
import { connectToPeerViaDht, getOwnPeerId } from '@/services/signaling-service';

export function usePeerManagement(dhtService) {
	const { setError, connection } = useConnection();
	const [peers, setPeers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [connecting, setConnecting] = useState(false);
	const [selectedPeerId, setSelectedPeerId] = useState(null);
	const [connectionRequests, setConnectionRequests] = useState([]);

	// Add connection request listener
	useEffect(() => {
		const handleConnectionRequest = (event) => {
			const { from, payload } = event.detail;
			setConnectionRequests(prev => {
				if (prev.some(req => req.from === from)) {
					return prev;
				}
				return [...prev, { from, payload, timestamp: new Date() }];
			});
		};

		window.addEventListener('peer-connection-request', handleConnectionRequest);
		return () => {
			window.removeEventListener('peer-connection-request', handleConnectionRequest);
		};
	}, []);

	// Load peers when dhtService changes
	useEffect(() => {
		if (dhtService) {
			loadPeers();
			const interval = setInterval(loadPeers, 5000);
			return () => clearInterval(interval);
		}
	}, [dhtService, connection]);

	// Log peer list updates
	useEffect(() => {
		console.log('Peers list updated:', peers);
	}, [peers]);

	// Function to load peers from DHT
	const loadPeers = async () => {
		if (!dhtService?.url) {
			console.log('Cannot load peers - dhtService or URL is missing');
			return;
		}

		try {
			setLoading(true);
			const peerList = await findPeersFromDht(dhtService.url);

			// Get our own peer ID directly from the connection object
			const myPeerId = getOwnPeerId();
			console.log('My peer ID for filtering:', myPeerId);

			// Filter out our own peer ID if available
			const filteredPeers = myPeerId
				? peerList.filter(p => p.peerId !== myPeerId)
				: peerList;

			console.log(`Loaded ${filteredPeers.length} peers (from total ${peerList.length})`);
			setPeers(filteredPeers);
		} catch (error) {
			console.error('Error loading peers:', error);
			setError?.(`Failed to load peers: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Connect to a specific peer
	const handleConnectToPeer = async (peerId) => {
		if (!dhtService || !dhtService.url) return;

		try {
			setConnecting(true);
			setSelectedPeerId(peerId);
			await connectToPeerViaDht(peerId, dhtService.url);
		} catch (error) {
			setError(`Failed to connect to peer: ${error.message}`);
		} finally {
			setConnecting(false);
		}
	};

	return {
		peers,
		loading,
		connecting,
		selectedPeerId,
		connectionRequests,
		setConnectionRequests,
		handleConnectToPeer,
		loadPeers
	};
}