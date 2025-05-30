import React, { useState, useRef } from 'react';
import { sendMessage, sendFile } from '@/services/message-service';
import Button from '../ui/Button';

function MessageInput() {
	const [input, setInput] = useState('');
	const fileInputRef = useRef();

	const handleSend = (e) => {
		e.preventDefault();
		if (input.trim()) {
			sendMessage(input);
			setInput('');
		}
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			sendFile(file);
			e.target.value = '';
		}
	};

	return (
		<form className="flex gap-2 p-3 border-t border-gray-700 bg-gray-900" onSubmit={handleSend}>
			<input
				type="text"
				className="flex-1 bg-gray-800 px-3 py-2  rounded text-white"
				placeholder="Type a message..."
				value={input}
				onChange={e => setInput(e.target.value)}
			/>
			<Button type="submit" variant="primary">Send</Button>
			<Button
				type="button"
				variant="secondary"
				onClick={() => fileInputRef.current.click()}
			>
				📎
			</Button>
			<input
				type="file"
				ref={fileInputRef}
				style={{ display: 'none' }}
				onChange={handleFileChange}
			/>
		</form>
	);
}

export default MessageInput;