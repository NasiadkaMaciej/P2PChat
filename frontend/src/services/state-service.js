"use client";

let connectionState = 'disconnected';
let subscribers = [];

/**
 * Subscribe to connection state changes
 */
export function subscribeToConnectionState(callback) {
	subscribers.push(callback);
	callback(connectionState);
	return () => {
		subscribers = subscribers.filter(cb => cb !== callback);
	};
}

/**
 * Update connection state and notify subscribers
 */
export function updateConnectionState(state) {
	connectionState = state;
	subscribers.forEach(callback => callback(state));
}

/**
 * Get current connection state
 */
export function getConnectionState() {
	return connectionState;
}