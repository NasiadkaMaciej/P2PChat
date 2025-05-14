'use client';
import React from 'react';
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

// Main page content
export default function Home() {
	const { connectionState, showChat, error, connectionMethod, showIceServerManager, setShowIceServerManager } = useConnection();
	const isConnected = connectionState === 'connected' && showChat;

	return (
		<div className="min-h-screen bg-gray-900 text-gray-200 p-6">
			<div className="max-w-6xl mx-auto flex flex-col" style={{ minHeight: 'calc(100vh - 3rem)' }}>
				{/* Header - Always visible */}
				<div className="mb-6">
					<div className="flex justify-between items-center">
						<h1 className="text-3xl font-bold text-white">P2P Chat</h1>
						<div className="flex gap-2 items-center">
							<Button
								onClick={() => setShowIceServerManager(!showIceServerManager)}
								variant="secondary"
								className="text-sm"
							>
								ICE Servers
							</Button>
							<ConnectionStatus />
						</div>
					</div>

					{/* Error Display */}
					{error && <ErrorDisplay error={error} />}

					{/* ICE Server Manager */}
					{showIceServerManager && <IceServerManager />}
				</div>

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