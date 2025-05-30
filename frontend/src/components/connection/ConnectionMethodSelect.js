'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useConnection } from '@/context/ConnectionContext';
import { fadeIn } from '@/utils/animation-utils';
import HelpPopup from '../ui/HelpPopup';

function ConnectionMethodSelect() {
	const { connectionMethod, setConnectionMethod } = useConnection();

	const methods = [
		{
			id: 'offer-answer',
			name: 'Manual Exchange',
			description: 'Manually exchange connection data with your peer'
		},
		{
			id: 'dht',
			name: 'DHT Network',
			description: 'Use a distributed hash table for discovery and signaling'
		}
	];

	return (
		<motion.div
			className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4"
			{...fadeIn}
		>
			<div className="mb-4">
				<div className="flex items-center">
					<h2 className="text-xl font-semibold">Connection Method</h2>
					<HelpPopup title="Connection Methods">
						<h4 className="font-medium mb-2">Manual Exchange</h4>
						<p className="mb-3">
							The manual exchange method requires you to copy and paste connection data between peers.
							This is the most private method as no third-party servers are involved in the signaling process.
						</p>

						<h4 className="font-medium mb-2">DHT Network</h4>
						<p>
							The DHT (Distributed Hash Table) method uses a lightweight signaling server to help
							peers discover each other and exchange connection data automatically. This is more
							convenient but requires trusting the DHT server.
						</p>
					</HelpPopup>
				</div>
				<p className="text-sm text-gray-400 mt-1">Select how you want to connect to a peer</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
				{methods.map((method) => (
					<button
						key={method.id}
						onClick={() => setConnectionMethod(method.id)}
						className={`p-3 rounded-md text-left transition-colors border ${connectionMethod === method.id
							? 'border-blue-500 bg-blue-900/20'
							: 'bg-gray-800 hover:bg-gray-700'
							}`}
					>
						<div className="font-medium">{method.name}</div>
						<div className="text-sm opacity-80">{method.description}</div>
					</button>
				))}
			</div>
		</motion.div>
	);
}

export default ConnectionMethodSelect;