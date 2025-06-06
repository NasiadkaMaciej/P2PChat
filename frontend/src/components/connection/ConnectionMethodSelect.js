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
						<p className="mb-3">
							Connection methods determine how peers discover each other and exchange the information
							needed to establish a direct WebRTC connection.
						</p>

						<h4 className="font-medium mb-2">Methods Comparison</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
							<div className="bg-gray-900 p-3 rounded-md">
								<h5 className="text-blue-400 mb-1">Manual Exchange</h5>
								<ul className="list-disc pl-5 space-y-1 text-sm">
									<li><strong>Process</strong>: Copy/paste connection data</li>
									<li><strong>Convenience</strong>: Requires more steps</li>
									<li><strong>Privacy</strong>: Highest privacy, no third parties</li>
									<li><strong>Use Case</strong>: For sensitive communications</li>
								</ul>
							</div>
							<div className="bg-gray-900 p-3 rounded-md">
								<h5 className="text-purple-400 mb-1">DHT Network</h5>
								<ul className="list-disc pl-5 space-y-1 text-sm">
									<li><strong>Process</strong>: Automatic discovery & exchange</li>
									<li><strong>Convenience</strong>: One-click connection</li>
									<li><strong>Privacy</strong>: DHT server sees connection metadata</li>
									<li><strong>Use Case</strong>: For easier, regular connections</li>
								</ul>
							</div>
						</div>

						<h4 className="font-medium mb-2">Privacy Considerations</h4>
						<p className="text-sm mb-2">
							Manual Exchange offers complete privacy as no servers are involved in the connection process.
							DHT Network requires trusting the DHT server with connection metadata (but not message content).
						</p>

						<h4 className="font-medium mb-2">Self-Hosting</h4>
						<p className="text-sm">
							For maximum privacy, you can easily host your own DHT service using our provided setup script.
							Self-hosting gives you full control over connection metadata while still enjoying automatic peer discovery.
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