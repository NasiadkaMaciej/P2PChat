import React from 'react';
import { motion } from 'framer-motion';
import { listItem } from '../../utils/animation-utils';

function Message({ message, isOwn }) {
	return (
		<motion.div
			className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
			{...listItem(message.id)}
		>
			<div
				className={`max-w-3/4 rounded-lg px-4 py-2 ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}`}
			>
				{!isOwn && (
					<div className="text-xs text-gray-300 mb-1">{message.sender || 'Anonymous'}</div>
				)}
				<div>{message.content}</div>
				<div className="text-xs opacity-70 text-right mt-1">
					{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
				</div>
			</div>
		</motion.div>
	);
}

export default Message;