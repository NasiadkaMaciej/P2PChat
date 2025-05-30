'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

export default function InfoPanel({ title, children, defaultOpen = false }) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className="bg-gray-800 rounded-lg border border-gray-700 mb-4 overflow-hidden">
			<div
				className="p-3 bg-gray-700 flex justify-between items-center cursor-pointer"
				onClick={() => setIsOpen(!isOpen)}
			>
				<h3 className="text-lg font-medium text-white">{title}</h3>
				<Button variant="secondary" size="xs">
					{isOpen ? 'Hide' : 'Show'}
				</Button>
			</div>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.3 }}
						className="overflow-hidden"
					>
						<div className="p-4 prose prose-invert max-w-none">
							{children}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}