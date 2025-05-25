'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserName, useUserName, initializeUsername } from '../../services/user-service';
import { fadeIn } from '../../utils/animation-utils';
import Button from '../ui/Button';

function UsernameInput() {
	const [isEditing, setIsEditing] = useState(false);
	const [username, setUsername] = useState('');
	const currentName = useUserName();

	useEffect(() => {
		setUsername(initializeUsername());
	}, []);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (username.trim()) {
			updateUserName(username.trim());
			setIsEditing(false);
		}
	};

	return (
		<div className="w-full">
			<AnimatePresence mode="wait">
				{isEditing ? (
					<motion.form
						onSubmit={handleSubmit}
						className="flex gap-2"
						{...fadeIn}
						key="edit-name"
					>
						<input
							key="username-input"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="flex-1 bg-gray-700 px-3 py-2 text-white rounded-md focus:outline-none"
							placeholder="Enter username"
							autoFocus
						/>
						<Button type="submit" key="save-button">Save</Button>
					</motion.form>
				) : (
					<motion.div
						className="flex justify-between items-center"
						{...fadeIn}
						key="display-name"
					>
						<span className="text-gray-300" key="username-label">
							Username: <span className="text-blue-400 font-medium">{currentName}</span>
						</span>
						<Button
							key="change-button"
							onClick={() => setIsEditing(true)}
							className="text-xs"
							variant="secondary"
						>
							Change
						</Button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default UsernameInput;