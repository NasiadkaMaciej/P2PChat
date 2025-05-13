'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useConnection } from '../../context/ConnectionContext';
import { statusIndicator, textColorAnimation } from '../../utils/animation-utils';

function ConnectionStatus() {
	const { connectionState } = useConnection();

	// Map state to color for text
	const stateColorMap = {
		connected: "#4ade80",
		disconnected: "#facc15",
		failed: "#ef4444",
		connecting: "#facc15",
		default: "#facc15"
	};

	return (
		<div className="flex items-center gap-2">
			<motion.div
				className="w-3 h-3 rounded-full"
				variants={statusIndicator}
				animate={connectionState}
			/>
			<motion.span
				className="text-sm"
				{...textColorAnimation(stateColorMap, connectionState)}
			>
				{connectionState}
			</motion.span>
		</div>
	);
}

export default ConnectionStatus;