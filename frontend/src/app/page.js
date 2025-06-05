'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useConnection } from '../context/ConnectionContext';
import Chat from '../components/chat/Chat';
import OfferAnswerExchange from '../components/connection/OfferAnswerExchange';
import ConnectionMethodSelect from '../components/connection/ConnectionMethodSelect';
import DhtServiceManager from '../components/connection/DhtServiceManager';
import { slideIn } from '../utils/animation-utils';
import IceServerManager from '../components/connection/IceServerManager';
import UsernameInput from '@/components/chat/UsernameInput';
import HelpPopup from '../components/ui/HelpPopup';
import TrackerServiceManager from '../components/connection/TrackerServiceManager';

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
				<div className="flex items-center mb-3">
					<h2 className="text-xl font-semibold">Connection Settings</h2>
					<HelpPopup title="Connection Settings">
						<p className="mb-3">
							Before starting a chat, configure your connection settings. Set your username
							and configure ICE servers that will help establish a direct peer-to-peer connection.
						</p>
						<h4 className="font-medium mb-2">Username</h4>
						<p className="mb-3">
							Your username will be visible to peers you connect with. It helps identify you in the chat.
						</p>
						<h4 className="font-medium mb-2">ICE Servers</h4>
						<p className="mb-3">
							ICE servers help establish direct connections between peers, especially when
							they are behind firewalls or NATs. You can use the default servers or add your own.
						</p>
						<h4 className="font-medium mb-2">Trackers</h4>
						<p>
							WebTorrent trackers help coordinate file transfers between peers.
							You can use the default trackers or add your own.
						</p>
					</HelpPopup>
				</div>
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
					<button
						className={`py-2 px-4 text-sm font-medium ${activeTab === 'trackers' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
						onClick={() => setActiveTab('trackers')}
					>
						Trackers
					</button>
				</div>

				{activeTab === 'profile' && (
					<UsernameInput />
				)}

				{activeTab === 'ice' && (
					<IceServerManager />
				)}

				{activeTab === 'trackers' && (
					<TrackerServiceManager />
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
					</div>
				</div>

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