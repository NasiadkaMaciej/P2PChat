import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { connectToPeerViaDht, acceptIncomingConnection } from '../../services/signaling-service';
import { findPeersFromDht } from '../../services/dht-service';
import { fadeIn, slideIn } from '../../utils/animation-utils';
import { useConnection } from '../../context/ConnectionContext';

function PeerList({ dhtService }) {
	const [peers, setPeers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [refreshTimer, setRefreshTimer] = useState(null);
	const [connecting, setConnecting] = useState(false);
	const [targetPeer, setTargetPeer] = useState(null);
	const [incomingRequest, setIncomingRequest] = useState(null);
	const { setError, setShowChat } = useConnection();

	// Load peers and set up refresh timer
	useEffect(() => {
		if (dhtService) {
			loadPeers();
			const timer = setInterval(loadPeers, 5000);
			setRefreshTimer(timer);
		}

		return () => {
			if (refreshTimer) {
				clearInterval(refreshTimer);
			}
		};
	}, [dhtService]);

	// Listen for incoming connection requests
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const handleConnectionRequest = (event) => {
				console.log("Connection request received:", event.detail);
				setIncomingRequest(event.detail);
			};

			const handleConnectionEstablished = () => {
				console.log("Connection established event received");
				setConnecting(false);
				setIncomingRequest(null);
				// Show chat when connection is established
				setShowChat(true);
			};

			window.addEventListener('peer-connection-request', handleConnectionRequest);
			window.addEventListener('peer-connection-established', handleConnectionEstablished);

			return () => {
				window.removeEventListener('peer-connection-request', handleConnectionRequest);
				window.removeEventListener('peer-connection-established', handleConnectionEstablished);
			};
		}
	}, [setShowChat]);

	const loadPeers = async () => {
		if (!dhtService) return;

		try {
			setLoading(true);
			const peerList = await findPeersFromDht(dhtService.url);
			// Filter out our own peer ID which is stored in window._ownPeerId during DHT connection
			const otherPeers = peerList.filter(p => p.peerId !== window._ownPeerId);
			setPeers(otherPeers);
		} catch (error) {
			setError(`Failed to load peers: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleConnectToPeer = async (peer) => {
		setConnecting(true);
		setTargetPeer(peer);

		try {
			await connectToPeerViaDht(peer.peerId, dhtService.url);
		} catch (error) {
			setError(`Failed to connect: ${error.message}`);
			setConnecting(false);
			setTargetPeer(null);
		}
	};

	const handleAcceptConnection = async () => {
		if (!incomingRequest) return;

		try {
			setConnecting(true);
			await acceptIncomingConnection(incomingRequest.payload, dhtService.url, incomingRequest.from);
			// The connection established event will reset connecting state
		} catch (error) {
			setError(`Failed to accept connection: ${error.message}`);
			setConnecting(false);
		}
	};

	const handleRejectConnection = () => {
		setIncomingRequest(null);
	};

	if (!dhtService) return null;

	return (
		<motion.div
			className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700"
			{...fadeIn}
		>
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-xl font-medium text-white">Available Users</h3>
			</div>

			{/* Incoming Connection Request */}
			<AnimatePresence>
				{incomingRequest && (
					<motion.div
						className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-md"
						{...slideIn('down')}
					>
						<p className="mb-2">
							<span className="font-medium">Connection request</span> from{' '}
							{peers.find(p => p.peerId === incomingRequest.from)?.name || 'Unknown user'}
						</p>
						<div className="flex space-x-3">
							<Button
								onClick={handleAcceptConnection}
								variant="success"
								disabled={connecting}
							>
								{connecting ? 'Accepting...' : 'Accept'}
							</Button>
							<Button onClick={handleRejectConnection} variant="danger">
								Reject
							</Button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{loading && peers.length === 0 ? (
				<div className="text-center py-4">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
				</div>
			) : peers.length === 0 ? (
				<motion.div className="p-3 bg-gray-700/50 rounded text-center" {...fadeIn}>
					No other users connected. Waiting for users to join...
				</motion.div>
			) : (
				<div className="space-y-3">
					{peers.map(peer => (
						<motion.div
							key={peer.peerId}
							className="p-3 rounded-md border border-gray-700 bg-gray-800/50"
							{...fadeIn}
						>
							<div className="flex justify-between items-center">
								<div>
									<h4 className="font-medium text-white">{peer.name || 'Anonymous'}</h4>
								</div>
								<Button
									onClick={() => handleConnectToPeer(peer)}
									disabled={connecting || incomingRequest !== null}
								>
									{connecting && targetPeer?.peerId === peer.peerId ? 'Connecting...' : 'Connect'}
								</Button>
							</div>
						</motion.div>
					))}
				</div>
			)}
		</motion.div>
	);
}

export default PeerList;