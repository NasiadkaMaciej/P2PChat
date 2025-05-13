'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useConnection } from '../../context/ConnectionContext';
import { fadeIn } from '../../utils/animation-utils';

function ConnectionMethodSelect() {
	const { connectionMethod, setConnectionMethod } = useConnection();

	const methods = [
		{ id: 'offer-answer', name: 'Manual Exchange', description: 'Exchange connection data manually' },
		{ id: 'dht', name: 'DHT Network', description: 'Connect through a distributed hash table' }
	];

	return (
		<motion.div
			{...fadeIn}
			className="w-full mb-6"
		>
			<h2 className="text-xl mb-2 font-semibold">Choose Connection Method</h2>
			<div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
				<div className="flex flex-col sm:flex-row gap-3">
					{methods.map((method) => (
						<button
							key={method.id}
							onClick={() => setConnectionMethod(method.id)}
							className={`px-4 py-3 rounded-md shadow transition-all ${connectionMethod === method.id
								? 'bg-blue-700 text-white'
								: 'bg-gray-800 hover:bg-gray-700'
								}`}
						>
							<div className="font-medium">{method.name}</div>
							<div className="text-sm opacity-80">{method.description}</div>
						</button>
					))}
				</div>
			</div>
		</motion.div>
	);
}

export default ConnectionMethodSelect;
