'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeToConnectionState } from '../services/state-service';
import { closeConnection } from '../services/connection-service';
import { initializeUsername } from '@/services/user-service';

// Create context
const ConnectionContext = createContext(null);

// Provider component
export function ConnectionProvider({ children }) {
	const [connectionState, setConnectionState] = useState('disconnected');
	const [showChat, setShowChat] = useState(false);
	const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
	const [error, setError] = useState('');
	const [connectionMethod, setConnectionMethod] = useState('offer-answer');
	const [selectedDht, setSelectedDht] = useState(null);
	const [dhtConnected, setDhtConnected] = useState(false);


	// Initialize app and subscribe to connection state
	useEffect(() => {
		if (typeof window !== 'undefined') {
			initializeUsername();
			const unsubscribe = subscribeToConnectionState(setConnectionState);
			return () => {
				unsubscribe();
				closeConnection();
			};
		}
	}, []);

	// Handle first connection and show chat
	useEffect(() => {
		if (connectionState === 'connected' && !hasConnectedOnce) {
			setHasConnectedOnce(true);
			setShowChat(true);
		}
	}, [connectionState, hasConnectedOnce]);

	// Reset error on connection state change
	useEffect(() => {
		if (connectionState === 'connected') {
			setError('');
		}
	}, [connectionState]);

	// Disconnect handler
	const disconnect = useCallback(() => {
		closeConnection();
		setShowChat(false);
	}, []);

	const contextValue = {
		connectionState,
		showChat,
		setShowChat,
		hasConnectedOnce,
		error,
		setError,
		disconnect,
		connectionMethod,
		setConnectionMethod,
		selectedDht,
		setSelectedDht,
		dhtConnected,
		setDhtConnected
	};

	return (
		<ConnectionContext.Provider value={contextValue}>
			{children}
		</ConnectionContext.Provider>
	);
}

// Hook to use the connection context
export function useConnection() {
	const context = useContext(ConnectionContext);
	if (!context) {
		throw new Error('useConnection must be used within a ConnectionProvider');
	}
	return context;
}