"use client";

import React from 'react';
import GenericServiceManager from '../ui/GenericServiceManager';
import { fetchAll, addRecord, editRecord, deleteRecord, toggleSelection } from '@/services/api-service';

// Fetch all available ICE servers
const fetchIceServers = async () => {
	try {
		const servers = await fetchAll('/api/ice-servers');
		return servers;
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
	const handleSelectServer = async (service, loadServices) => {
		try {
			await toggleSelection('/api/ice-servers', service._id);

			await loadServices();

			return true;
		} catch (error) {
			console.error('Error handling service selection:', error);
			return false;
		}
	};

	const isServerSelected = (server) => {
		return server.selected;
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
			helpContent={
				<>
					<h4 className="font-medium mb-2">What are ICE Servers?</h4>
					<p className="mb-3">
						ICE (Interactive Connectivity Establishment) servers help WebRTC connections establish
						direct peer-to-peer communication across different network environments, particularly
						when peers are behind firewalls, NATs, or other network obstacles.
					</p>

					<h4 className="font-medium mb-2">Difference Between STUN and TURN</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
						<div className="bg-gray-900 p-3 rounded-md">
							<h5 className="text-blue-400 mb-1">STUN Servers</h5>
							<ul className="list-disc pl-5 space-y-1 text-sm">
								<li><strong>Purpose</strong>: Discovers your public IP address</li>
								<li><strong>Usage</strong>: Lightweight, used first</li>
								<li><strong>Success Rate</strong>: Works for ~85% of cases</li>
							</ul>
						</div>
						<div className="bg-gray-900 p-3 rounded-md">
							<h5 className="text-green-400 mb-1">TURN Servers</h5>
							<ul className="list-disc pl-5 space-y-1 text-sm">
								<li><strong>Purpose</strong>: Acts as a relay when direct connections fail</li>
								<li><strong>Usage</strong>: Fallback when STUN fails</li>
								<li><strong>Success Rate</strong>: Resolves ~99% of cases</li>
							</ul>
						</div>
					</div>

					<h4 className="font-medium mb-2">Privacy Considerations</h4>
					<p className="text-sm">
						STUN servers reveal your IP address to peers. TURN servers can provide IP anonymization,
						but the TURN provider can see your traffic. Use trusted servers for sensitive communications.
					</p>
				</>
			}
		/>
	);
}

export default IceServerManager;