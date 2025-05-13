import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserName, useUserName } from '../../services/user-service';
import { fadeIn } from '../../utils/animation-utils';
import Button from '../ui/Button';

function UsernameInput() {
	const currentName = useUserName();
	const [username, setUsername] = useState(currentName);
	const [isEditing, setIsEditing] = useState(false);

	const handleSubmit = (e) => {
		e.preventDefault();
		if (username.trim()) {
			updateUserName(username.trim());
			setIsEditing(false);
		}
	};

	return (
		<div className="p-2 bg-gray-800 border-b border-gray-700">
			<AnimatePresence mode="wait">
				{isEditing ? (
					<motion.form
						onSubmit={handleSubmit}
						className="flex"
						key="edit-form"
					>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="flex-1 bg-gray-700 text-white px-2 py-1 rounded"
							autoFocus
						/>
						<Button
							type="submit"
							className="ml-2"
							variant="primary"
						>
							Save
						</Button>
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