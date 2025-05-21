'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animation-utils';
import Button from '../ui/Button';
import { usePeerManagement } from '@/hooks/usePeerManagement';
import { connectViaDht, acceptIncomingConnection } from '@/services/signaling-service';

function PeerList({ dhtService }) {
	const {
		peers,
		loading,
		connecting,
		selectedPeerId,
		connectionRequests,
		setConnectionRequests,
		handleConnectToPeer,
		loadPeers
	} = usePeerManagement(dhtService);

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