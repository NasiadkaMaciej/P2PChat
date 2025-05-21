'use client';
import React from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import GenericServiceManager from '../ui/GenericServiceManager';
import { fetchAll, addRecord, editRecord, deleteRecord, performAction } from '@/services/api-service';

// Fetch all available ICE servers
const fetchIceServers = async () => {
	const response = await fetchAll('/api/ice-servers');
	if (response && response.iceServers) {
		return response.iceServers.map((server, index) => ({
			_id: server._id,
			name: server.name || server.url,
			type: server.urls.startsWith('stun:') ? 'stun' : 'turn',
			url: server.urls,
			username: server.username || '',
			credential: server.credential || '',
			selected: server.selected || false
		}));
	}
	return [];
};

// Add a new ICE server
const addIceServer = async (name, type, url, username, credential) => {
	return addRecord('/api/ice-servers', { name, type, url, username, credential });
};

// Edit an ICE server
const editIceServer = async (id, name, type, url, username, credential) => {
	return editRecord('/api/ice-servers', id, { name, type, url, username, credential });
};

// Delete an ICE server
const deleteIceServer = async (id) => {
	return deleteRecord('/api/ice-servers', id);
};

// Select an ICE server
const selectIceServer = async (id) => {
	return performAction('/api/ice-servers', id, 'select');
};

// Deselect an ICE server
const deselectIceServer = async (id) => {
	return performAction('/api/ice-servers', id, 'deselect');
};

function IceServerManager() {
	const { execute } = useAsyncAction();

	const initialFormState = {
		name: '',
		type: 'stun',
		url: '',
		username: '',
		credential: ''
	};

	const formFields = [
		{ name: 'name', label: 'Name', placeholder: 'My STUN Server' },
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
			await execute(
				() => server.selected
					? deselectIceServer(server._id)
					: selectIceServer(server._id),
				`${server.selected ? 'deselect' : 'select'} ICE server`
			);
			return true; // Signal success to trigger reload
		} catch (error) {
			return false;
		}
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
		/>
	);
}

export default IceServerManager;