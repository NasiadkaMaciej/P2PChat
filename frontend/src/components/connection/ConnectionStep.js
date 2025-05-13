'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { interactive } from '../../utils/animation-utils';

function ConnectionStep({
	stepNumber,
	title,
	buttonText,
	onClick,
	disabled = false,
	inputValue,
	setInputValue,
	showInput = false,
	placeholder = ""
}) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
			className="mb-4"
		>
			{showInput && (
				<>
					<p className="mb-2 text-gray-400">{title}</p>
					<textarea
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						rows={4}
						placeholder={placeholder}
						className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm mb-2 focus:outline-none"
					/>
				</>
			)}
			<motion.button
				onClick={onClick}
				disabled={disabled}
				className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50`}
				{...interactive(disabled)}
			>
				{`${stepNumber}. ${buttonText}`}
			</motion.button>
		</motion.div>
	);
}

export default ConnectionStep;