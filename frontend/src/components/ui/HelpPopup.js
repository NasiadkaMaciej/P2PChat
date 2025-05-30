import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '@/utils/animation-utils';
import { createPortal } from 'react-dom';

export default function HelpPopup({ title, children }) {
	const [isOpen, setIsOpen] = useState(false);
	const popupRef = useRef(null);

	// Close popup when clicking outside
	useEffect(() => {
		function handleClickOutside(event) {
			if (popupRef.current && !popupRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	// Use portal to render the popup at the body level
	const PopupContent = () => {
		if (!isOpen) return null;

		return createPortal(
			<motion.div
				className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
			>
				<motion.div
					ref={popupRef}
					className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
					{...fadeIn}
				>
					<div className="flex justify-between items-center p-4 border-b border-gray-700">
						<h3 className="text-xl font-medium text-blue-400">{title}</h3>
						<button
							onClick={() => setIsOpen(false)}
							className="text-gray-400 hover:text-white"
						>
							✕
						</button>
					</div>
					<div className="p-4">
						{children}
					</div>
				</motion.div>
			</motion.div>,
			document.body
		);
	};

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="ml-2 text-xs text-gray-400 hover:text-blue-400 bg-gray-700/50 hover:bg-gray-700 px-2 py-0.5 rounded-full"
				title={`Help for ${title}`}
			>
				?
			</button>

			<AnimatePresence>
				{isOpen && <PopupContent />}
			</AnimatePresence>
		</>
	);
}