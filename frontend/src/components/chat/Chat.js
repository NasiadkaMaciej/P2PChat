'use client';
import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
// Remove UsernameInput import

function Chat() {
	return (
		<div className="flex-1 flex flex-col rounded-lg border border-gray-700 overflow-hidden bg-gray-800/50">
			<div className="flex-1 overflow-hidden">
				<MessageList />
			</div>
			<MessageInput />
		</div>
	);
}

export default Chat;