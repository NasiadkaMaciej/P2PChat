'use client';
import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Message from './Message';
import { useUserName } from '../../services/user-service';

function MessageList({ messages = [] }) {
	const messagesEndRef = useRef(null);
	const currentUser = useUserName();

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages.length]);

	return (
		<motion.div
			className="flex-1 overflow-y-auto p-4 space-y-2"
			initial="hidden"
			animate="show"
		>
			<AnimatePresence>
				{messages.map((message) => (
					<Message
						key={message.id}
						message={message}
						isOwn={message.sender === currentUser}
						layout
					/>
				))}
			</AnimatePresence>
			<div ref={messagesEndRef} />
		</motion.div>
	);
}

export default MessageList;