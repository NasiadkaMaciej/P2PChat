'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useConnection } from '../context/ConnectionContext';
import Chat from '../components/chat/Chat';
import ConnectionStatus from '../components/connection/ConnectionStatus';
import OfferAnswerExchange from '../components/connection/OfferAnswerExchange';
import ConnectionMethodSelect from '../components/connection/ConnectionMethodSelect';
import DhtServiceManager from '../components/connection/DhtServiceManager';
import { slideIn } from '../utils/animation-utils';
import Button from '@/components/ui/Button';
import IceServerManager from '../components/connection/IceServerManager';
import UsernameInput from '@/components/chat/UsernameInput';
import HelpCenter from '@/components/HelpCenter';

// Error display component
const ErrorDisplay = ({ error }) => {
	if (!error) return null;

	return (
		<motion.div
			className="mb-6 p-3 bg-red-900/40 border border-red-700 rounded-md text-red-200"
			{...slideIn('up')}
		>
			<p>{error}</p>
		</motion.div>
	);
};

const ConnectionSettings = () => {
	const [activeTab, setActiveTab] = useState('profile');

	return (
		<div className="rounded-lg bg-gray-800/50 border border-gray-700 overflow-hidden mb-6">
			<div className="p-4">
				<h2 className="text-xl font-semibold mb-3">Connection Settings</h2>

				<div className="flex border-b border-gray-700 mb-4">
					<button
						className={`py-2 px-4 text-sm font-medium ${activeTab === 'profile' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
						onClick={() => setActiveTab('profile')}
					>
						Username
					</button>
					<button
						className={`py-2 px-4 text-sm font-medium ${activeTab === 'ice' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
						onClick={() => setActiveTab('ice')}
					>
						ICE Servers
					</button>
				</div>

				{activeTab === 'profile' && (
					<div className="py-2">
						<UsernameInput />
					</div>
				)}

				{activeTab === 'ice' && (
					<div className="py-2">
						<IceServerManager />
					</div>
				)}
			</div>
		</div>
	);
};

// Main page content
export default function Home() {
	const { connectionState, showChat, error, connectionMethod } = useConnection();
	const isConnected = connectionState === 'connected' && showChat;

	return (
		<div className="min-h-screen bg-gray-900 text-gray-200 p-6">
			<div className="max-w-6xl mx-auto flex flex-col space-y-6" style={{ minHeight: 'calc(100vh - 3rem)' }}>
				{/* Header - Always visible */}
				<div>
					<div className="flex justify-between items-center">
						<h1 className="text-3xl font-bold text-white">P2P Chat</h1>
						<div className="flex gap-2 items-center">
							<ConnectionStatus />
						</div>
					</div>
				</div>

				<HelpCenter />

				{/* Error Display */}
				{error && <ErrorDisplay error={error} />}

				{/* Connection Settings */}
				{!isConnected && <ConnectionSettings />}

				{/* Rest of the existing page content */}
				<div className="flex-1 flex flex-col">
					{/* Connection Method Selection (when not chatting) */}
					{!isConnected && <ConnectionMethodSelect />}

					{/* Connection Components based on Method */}
					{!isConnected && (
						<>
							{connectionMethod === 'offer-answer' && <OfferAnswerExchange />}
							{connectionMethod === 'dht' && <DhtServiceManager />}
						</>
					)}

					{/* Chat Area */}
					{isConnected && (
						<div className="flex-1" style={{ minHeight: '400px' }}>
							<Chat />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}