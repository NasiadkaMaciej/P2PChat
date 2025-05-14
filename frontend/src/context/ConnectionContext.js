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
	const [error, setError] = useState('');
	const [connectionMethod, setConnectionMethod] = useState('offer-answer');
	const [selectedDht, setSelectedDht] = useState(null);
	const [dhtConnected, setDhtConnected] = useState(false);
	const [showIceServerManager, setShowIceServerManager] = useState(false);

	// Initialize app and subscribe to connection state
	useEffect(() => {
		initializeUsername();
		const unsubscribe = subscribeToConnectionState(setConnectionState);
		return () => {
			unsubscribe();
			closeConnection();
		};
	}, []);

	useEffect(() => {
		if (connectionState === 'connected') {
			setError('');
			setShowChat(true);
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
		error,
		setError,
		connectionMethod,
		setConnectionMethod,
		selectedDht,
		setSelectedDht,
		dhtConnected,
		setDhtConnected,
		showIceServerManager,
		setShowIceServerManager
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