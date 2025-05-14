'use client';
import React from 'react';
import { useConnection } from '@/context/ConnectionContext';
import {
	fetchIceServers, addIceServer, editIceServer, deleteIceServer,
	selectIceServer, deselectIceServer
} from '@/services/ice-service.js';
import { useServiceManagement } from '@/hooks/useServiceManagement';
import ServiceForm from '../ui/ServiceForm';
import ServiceManager from '../ui/ServiceManager';
import ServiceItem from '../ui/ServiceItem';

function IceServerManager() {
	const { setError } = useConnection();
	const initialFormState = {
		name: '',
		type: 'stun',
		url: '',
		username: '',
		credential: ''
	};

	const {
		services: iceServers,
		formData: newServer,
		setFormData: setNewServer,
		loading,
		showForm,
		setShowForm,
		editing,
		handleFormSubmit,
		startEdit,
		cancelEdit,
		loadServices: loadIceServers
	} = useServiceManagement({
		fetchServices: fetchIceServers,
		addService: (data) => addIceServer(
			data.name, data.type, data.url, data.username, data.credential
		),
		editService: (id, data) => editIceServer(
			id, data.name, data.type, data.url, data.username, data.credential
		),
		deleteService: deleteIceServer,
		serviceTypeLabel: 'ICE server',
		initialFormState
	});

	const handleSelectServer = async (server) => {
		try {
			setLoading(true);
			if (server.selected) {
				await deselectIceServer(server._id);
			} else {
				await selectIceServer(server._id);
			}
			loadIceServers();
		} catch (error) {
			setError(`Failed to ${server.selected ? 'deselect' : 'select'} ICE server: ${error.message}`);
		} finally {
			setLoading(false);
		}
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
			placeholder: (newServer.type === 'stun') ?
				'stun:stun.example.com:3478' :
				'turn:turn.example.com:3478'
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

	const renderForm = () => (
		<ServiceForm
			formData={newServer}
			onChange={setNewServer}
			onSubmit={handleFormSubmit}
			onCancel={cancelEdit}
			fields={formFields}
			isEditing={!!editing}
			isLoading={loading}
			title="ICE Server"
		/>
	);

	// Inside IceServerManager component:
	const renderServerItem = (server) => (
		<ServiceItem
			service={server}
			onSelect={() => handleSelectServer(server)}
			onEdit={() => startEdit(server)}
			onDelete={async () => {
				try {
					await deleteIceServer(server._id);
					loadIceServers();
				} catch (error) {
					setError(`Failed to delete: ${error.message}`);
				}
			}}
			selected={server.selected}
			showTypeLabel={true}
		/>
	);

	return (
		<ServiceManager
			title="ICE Servers"
			services={iceServers}
			loading={loading}
			selectedService={null}
			showAddForm={showForm}
			formValues={{ editing: !!editing }}
			onAdd={() => {
				setShowForm(true);
				setNewServer(initialFormState);
			}}
			onCancelEdit={cancelEdit}
			onFormSubmit={handleFormSubmit}
			renderForm={renderForm}
			renderServiceItem={renderServerItem}
		/>
	);
}

export default IceServerManager;