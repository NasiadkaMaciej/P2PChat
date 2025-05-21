"use client";

import React, { useState, useEffect } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import GenericServiceManager from '../ui/GenericServiceManager';
import { fetchAll, addRecord, editRecord, deleteRecord } from '@/services/api-service';

// Fetch all available ICE servers
const fetchIceServers = async () => {
	try {
		const response = await fetchAll('/api/ice-servers');
		if (response && response.iceServers) {
			return response.iceServers.map((server) => ({
				_id: server._id,
				name: server.name || server.url,
				type: server.type,
				url: server.urls,
				username: server.username || '',
				credential: server.credential || '',
				isDefault: server.isDefault || false
			}));
		}
		return [];
	} catch (error) {
		console.error('Error fetching ICE servers:', error);
		return [];
	}
};

// Add a new ICE server
const addIceServer = async (name, type, url, username, credential) => {
	const serverData = { name, type, url };
	// Only add credentials for TURN servers
	if (type === 'turn') {
		serverData.username = username;
		serverData.credential = credential;
	}
	return addRecord('/api/ice-servers', serverData);
};

// Edit an ICE server
const editIceServer = async (id, name, type, url, username, credential) => {
	const serverData = { name, type, url };
	// Only include credentials for TURN servers
	if (type === 'turn') {
		serverData.username = username;
		serverData.credential = credential;
	}
	return editRecord('/api/ice-servers', id, serverData);
};

// Delete an ICE server
const deleteIceServer = async (id) => {
	return deleteRecord('/api/ice-servers', id);
};

function IceServerManager() {
	const { execute } = useAsyncAction();
	const [selectedServers, setSelectedServers] = useState([]);

	// Load selected servers from localStorage or select defaults
	useEffect(() => {
		const saved = localStorage.getItem('selectedIceServers');
		if (saved) {
			setSelectedServers(JSON.parse(saved));
		} else {
			// If no selection exists, fetch and select default servers
			const selectDefaults = async () => {
				try {
					const response = await fetchIceServers();
					if (response.success && response.data) {
						const defaultServerIds = response.data
							.filter(server => server.isDefault)
							.map(server => server._id);

						if (defaultServerIds.length > 0) {
							saveSelectedServers(defaultServerIds);
						}
					}
				} catch (error) {
					console.error('Error selecting default servers:', error);
				}
			};

			selectDefaults();
		}
	}, []);

	// Save selected servers to localStorage
	const saveSelectedServers = (servers) => {
		localStorage.setItem('selectedIceServers', JSON.stringify(servers));
		setSelectedServers(servers);
	};

	const initialFormState = {
		name: '',
		type: 'stun',
		url: '',
		username: '',
		credential: ''
	};

	const formFields = [
		{ name: 'name', label: 'Name', placeholder: 'My ICE Server' },
		{
			name: 'type',
			label: 'Type',
			type: 'select',
			options: [
				{ value: 'stun', label: 'STUN' },
				{ value: 'turn', label: 'TURN' }
			]
		},
		{
			name: 'url',
			label: 'URL',
			placeholder: (formData) => formData.type === 'stun'
				? 'stun:stun.example.com:3478'
				: 'turn:turn.example.com:3478'
		},
		{
			name: 'username',
			label: 'Username',
			placeholder: 'username',
			condition: (data) => data.type === 'turn'
		},
		{
			name: 'credential',
			label: 'Credential',
			type: 'password',
			placeholder: 'password',
			condition: (data) => data.type === 'turn'
		}
	];

	const handleSelectServer = async (server) => {
		try {
			const isSelected = selectedServers.includes(server._id);
			let newSelection;

			if (isSelected) {
				newSelection = selectedServers.filter(id => id !== server._id);
				saveSelectedServers(newSelection);
				return true; // Signal success to trigger reload
			}

			// Adding a new server - need to respect the type constraint
			const allServers = await fetchIceServers();

			// Get currently selected servers as objects
			const currentSelectedServers = allServers.filter(s =>
				selectedServers.includes(s._id)
			);

			// Find if we already have selected a server of the same type
			const sameTypeSelected = currentSelectedServers.find(s =>
				s.type === server.type
			);

			if (sameTypeSelected) { // Replace the existing server of same type with the new one
				newSelection = selectedServers.filter(id =>
					id !== sameTypeSelected._id
				);
				newSelection.push(server._id);
			} else { // No server of this type selected yet, add to selection
				newSelection = [...selectedServers, server._id];
			}

			saveSelectedServers(newSelection);
			return true; // Signal success to trigger reload
		} catch (error) {
			console.error('Error handling server selection:', error);
			return false;
		}
	};

	const isServerSelected = (server) => {
		return selectedServers.includes(server._id);
	};

	return (
		<GenericServiceManager
			title="ICE Servers"
			serviceTypeLabel="ICE Server"
			initialFormState={initialFormState}
			fetchServices={fetchIceServers}
			addService={(data) => addIceServer(
				data.name, data.type, data.url, data.username, data.credential
			)}
			editService={(id, data) => editIceServer(
				id, data.name, data.type, data.url, data.username, data.credential
			)}
			deleteService={deleteIceServer}
			onSelect={handleSelectServer}
			showTypeLabel={true}
			formFields={formFields}
			isSelected={isServerSelected}
		/>
	);
}

export default IceServerManager;