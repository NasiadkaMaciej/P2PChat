'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeIn, interactive } from '../../utils/animation-utils';

function CopyableText({ value, label, buttonText = 'Copy', highlightColor = 'blue' }) {
	const [copied, setCopied] = useState(false);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(value);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// Color mapping using Tailwind classes
	const colors = {
		blue: {
			textColor: 'text-blue-400',
			borderColor: 'border-blue-600',
			buttonBg: 'bg-blue-600 hover:bg-blue-700',
		},
		green: {
			textColor: 'text-green-400',
			borderColor: 'border-green-600',
			buttonBg: 'bg-green-600 hover:bg-green-700',
		}
	}[highlightColor] || colors.blue;

	return (
		<motion.div
			className={`mt-4 p-3 bg-gray-900 border border-dashed ${colors.borderColor} rounded-md`}
			{...fadeIn}
		>
			<div className="mb-2">
				<span className="text-sm text-gray-300">{label}</span>
			</div>

			<div className={`font-mono text-sm ${colors.textColor} bg-gray-800 p-2 rounded mb-2 break-all`}>
				{value}
			</div>

			<motion.button
				onClick={copyToClipboard}
				className={`text-sm px-3 py-1 ${colors.buttonBg} text-white rounded flex items-center`}
				{...interactive(false)}
			>
				{copied ? 'Copied!' : buttonText || 'Copy'}
			</motion.button>
		</motion.div>
	);
}

export default CopyableText;