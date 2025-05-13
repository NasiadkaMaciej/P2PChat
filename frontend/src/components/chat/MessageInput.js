'use client';
import React, { useState } from 'react';
import { sendMessage } from '../../services/message-service';
import Button from '../ui/Button';

function MessageInput() {
	const [newMessage, setNewMessage] = useState('');

	const handleSendMessage = (e) => {
		e.preventDefault();
		if (newMessage.trim()) {
			sendMessage(newMessage);
			setNewMessage('');
		}
	};

	return (
		<form
			onSubmit={handleSendMessage}
			className="border-t border-gray-700 flex p-2"
		>
			<input
				type="text"
				value={newMessage}
				onChange={(e) => setNewMessage(e.target.value)}
				className="flex-1 bg-gray-800 px-3 py-2 text-white rounded-l focus:outline-none"
				placeholder="Type message here..."
			/>
			<Button
				type="submit"
				className="rounded-l-none"
			>
				Send
			</Button>
		</form>
	);
}

export default MessageInput;