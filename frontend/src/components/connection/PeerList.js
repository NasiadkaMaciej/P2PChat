'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { findPeersFromDht } from '@/services/dht-service';
import { connectToPeerViaDht } from '@/services/signaling-service';
import { fadeIn } from '@/utils/animation-utils';
import Button from '../ui/Button';
import { useConnection } from '@/context/ConnectionContext';
import { connectViaDht, acceptIncomingConnection } from '@/services/signaling-service';
import { getOwnPeerId } from '@/services/signaling-service';

function PeerList({ dhtService }) {
	const { setError, connection } = useConnection();
	const [peers, setPeers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [connecting, setConnecting] = useState(false);
	const [selectedPeerId, setSelectedPeerId] = useState(null);
	const [connectionRequests, setConnectionRequests] = useState([]);

	// Get access to the current user's peerId from the ConnectionContext
	useEffect(() => {
		if (!connection) return;

		// Log the current connection state to help debug
		console.log('Current connection state:', connection);
	}, [connection]);

	// Log whenever peers list changes
	useEffect(() => {
		console.log('Peers list updated:', peers);
	}, [peers]);

	// Add useEffect to listen for connection requests
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

	// Load peers when component mounts or dhtService changes
	useEffect(() => {
		if (dhtService) {
			loadPeers();
			const interval = setInterval(loadPeers, 5000);
			return () => clearInterval(interval);
		}
	}, [dhtService, connection]); // Added connection as dependency

	// Function to load peers from DHT with improved filtering
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

	if (!dhtService) return null;

	return (
		<motion.div
			className="mt-2 p-3 border border-gray-700 rounded-md bg-gray-800/50"
			{...fadeIn}
		>

			{connectionRequests.length > 0 && (
				<div className="mb-3 p-2 bg-yellow-900/30 border border-yellow-700/50 rounded-md">
					<h5 className="text-sm font-medium text-yellow-300 mb-1">Incoming Connection Requests</h5>
					{connectionRequests.map((request) => (
						<div key={request.from} className="flex justify-between items-center py-1">
							<span className="text-sm text-white">{request.from.split('-').slice(-1)[0]}</span>
							<div className="flex gap-2">
								<Button
									onClick={() => {
										connectViaDht(dhtService).then(() => {
											acceptIncomingConnection(request.payload, dhtService.url, request.from);
											setConnectionRequests(prev => prev.filter(req => req.from !== request.from));
										});
									}}
									variant="primary"
									size="xs"
								>
									Accept
								</Button>
								<Button
									onClick={() => {
										setConnectionRequests(prev => prev.filter(req => req.from !== request.from));
									}}
									variant="danger"
									size="xs"
								>
									Reject
								</Button>
							</div>
						</div>
					))}
				</div>
			)}
			<h4 className="text-sm font-medium text-white mb-2">Available Peers</h4>

			{loading && peers.length === 0 ? (
				<div className="text-center py-2">
					<div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
				</div>
			) : (
				<div>
					{peers.length === 0 ? (
						<p className="text-xs text-gray-400">No other peers connected. Waiting for someone to join...</p>
					) : (
						<div className="space-y-2">
							{peers.map((peer) => (
								<div
									key={peer.peerId}
									className="flex items-center justify-between py-1 px-2 bg-gray-700/50 rounded-md"
								>
									<div>
										<span className="text-sm text-white">{peer.name || 'Unknown User'}</span>
										<span className="text-xs text-gray-400 ml-2">(ID: {peer.peerId.substring(0, 8)}...)</span>
									</div>
									<Button
										onClick={() => handleConnectToPeer(peer.peerId)}
										variant="primary"
										size="xs"
										disabled={connecting && selectedPeerId === peer.peerId}
									>
										{connecting && selectedPeerId === peer.peerId
											? 'Connecting...'
											: 'Connect'}
									</Button>
								</div>
							))}
						</div>
					)}

					<div className="flex justify-end mt-2">
						<Button
							onClick={loadPeers}
							variant="secondary"
							size="xs"
							disabled={loading}
						>
							{loading ? 'Refreshing...' : 'Refresh Peers'}
						</Button>
					</div>
				</div>
			)}
		</motion.div>
	);
}

export default PeerList;