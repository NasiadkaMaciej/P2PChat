'use client';
import React from 'react';
import {
	fetchIceServers, addIceServer, editIceServer, deleteIceServer,
	selectIceServer, deselectIceServer
} from '@/services/ice-service.js';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import GenericServiceManager from '../ui/GenericServiceManager';

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