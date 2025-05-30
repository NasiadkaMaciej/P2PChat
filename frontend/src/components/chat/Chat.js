"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useConnection } from '../../context/ConnectionContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { subscribeToMessages } from '../../services/message-service';
import { scaleIn, interactive } from '../../utils/animation-utils';

function Chat() {
	const { showChat, disconnect } = useConnection();
	const [messages, setMessages] = useState([]);

	useEffect(() => {
		const unsubscribe = subscribeToMessages(setMessages);
		return unsubscribe;
	}, []);

	if (!showChat) return null;

	return (
		<motion.div
			className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 flex flex-col mb-2"
			style={{ height: '75vh' }}
			{...scaleIn}
		>
			<div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
				<h3 className="text-white font-medium">P2P Chat</h3>
				<motion.button
					onClick={disconnect}
					className="px-3 py-1 bg-red-800 hover:bg-red-900 text-white rounded text-sm transition-colors"
					{...interactive(false)}
				>
					Disconnect
				</motion.button>
			</div>

			<div className="flex-1 overflow-hidden">
				<MessageList messages={messages} />
			</div>

			<MessageInput />
		</motion.div>
	);
}

export default Chat;