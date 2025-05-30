'use client';
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Message from './Message';
import { useUserName } from '../../services/user-service';

function formatSize(bytes) {
	if (bytes > 1024 * 1024)
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	if (bytes > 1024)
		return (bytes / 1024).toFixed(2) + ' KB';
	return bytes + ' B';
}

function MessageList({ messages = [] }) {
	const messagesEndRef = useRef(null);
	const currentUser = useUserName();
	const [progress, setProgress] = useState({});

	// Handle file progress events
	useEffect(() => {
		function updateProgress(e, type) {
			setProgress(p => {
				const prev = p[e.detail.id] || {};
				const now = Date.now();
				const transferred = e.detail.transferred || 0;
				const fileSize = e.detail.fileSize || prev.fileSize || 1;
				const percent = Math.min(100, Math.round((transferred / fileSize) * 100));

				return {
					...p,
					[e.detail.id]: {
						...prev,
						type,
						fileName: e.detail.fileName || prev.fileName,
						fileSize,
						transferred,
						percent,
						startTime: prev.startTime || now,
						prevTime: prev.lastTime || now,
						lastTransferred: prev.transferred || 0,
						lastTime: now
					}
				};
			});
		}

		function removeProgress(e) {
			setProgress(p => {
				const copy = { ...p };
				delete copy[e.detail.id];
				return copy;
			});
		}

		const handleSend = e => updateProgress(e, 'send');
		const handleReceive = e => updateProgress(e, 'receive');
		const handleComplete = e => removeProgress(e);

		window.addEventListener('file-send-progress', handleSend);
		window.addEventListener('file-receive-progress', handleReceive);
		window.addEventListener('file-send-complete', handleComplete);
		window.addEventListener('file-receive-complete', handleComplete);

		return () => {
			window.removeEventListener('file-send-progress', handleSend);
			window.removeEventListener('file-receive-progress', handleReceive);
			window.removeEventListener('file-send-complete', handleComplete);
			window.removeEventListener('file-receive-complete', handleComplete);
		};
	}, []);

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages.length]);

	return (
		<motion.div
			className="flex-1 overflow-y-auto h-full min-h-0 p-4 space-y-2"
			initial="hidden"
			animate="show"
		>
			<AnimatePresence>
				{messages.map((msg) => {
					const data = typeof msg === 'string' ? JSON.parse(msg) : msg;
					return (
						<motion.div key={data.id} layout>
							{data.type === 'file' ? (
								<div className="flex flex-col">
									<span className="text-xs text-gray-400">
										{data.sender === currentUser ? 'You' : data.sender} sent a file:
									</span>
									<a
										href={data.url}
										download={data.fileName}
										className="text-blue-400 underline"
										target="_blank"
										rel="noopener noreferrer"
									>
										{data.fileName} ({formatSize(data.fileSize)})
									</a>
								</div>
							) : (
								<Message
									message={data}
									isOwn={data.sender === currentUser}
								/>
							)}
						</motion.div>
					);
				})}
			</AnimatePresence>

			{/* Show progress for files in progress but not yet in messages */}
			{Object.entries(progress).map(([id, prog]) => (
				<div key={id} className="flex flex-col">
					<span className="text-xs text-gray-400">
						{prog.type === 'send' ? 'Sending' : 'Receiving'}: <b>{prog.fileName || '...'}</b> ({formatSize(prog.fileSize || 0)})
					</span>
					<div className="w-full bg-gray-700 rounded mt-1 h-2">
						<div
							className={`h-2 rounded ${prog.type === 'send' ? 'bg-blue-500' : 'bg-green-500'}`}
							style={{ width: `${prog.percent || 0}%` }}
						/>
					</div>
				</div>
			))}
			<div ref={messagesEndRef} />
		</motion.div>

	);
}

export default MessageList;