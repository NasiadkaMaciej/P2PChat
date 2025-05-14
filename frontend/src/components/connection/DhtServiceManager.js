'use client';
import React, { useState } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { fetchDhtServices, addDhtService, editDhtService, deleteDhtService } from '@/services/dht-service.js';
import { useUserName } from '@/services/user-service';
import { connectViaDht } from '@/services/signaling-service';
import { useServiceManagement } from '@/hooks/useServiceManagement';
import ServiceForm from '../ui/ServiceForm';
import ServiceManager from '../ui/ServiceManager';
import PeerList from './PeerList';
import ServiceItem from '../ui/ServiceItem';

function DhtServiceManager() {
	const { setError } = useConnection();
	const username = useUserName();
	const [connecting, setConnecting] = useState(false);
	const [connected, setConnected] = useState(null);
	const [connectedService, setConnectedService] = useState(null);

	const initialFormState = {
		name: '',
		url: '',
		port: ''
	};

	const {
		services: dhtServices,
		formData: newService,
		setFormData: setNewService,
		loading,
		showForm,
		setShowForm,
		editing,
		handleFormSubmit,
		startEdit: baseStartEdit,
		cancelEdit,
		loadServices: loadDhtServices
	} = useServiceManagement({
		fetchServices: fetchDhtServices,
		addService: (data) => addDhtService(data.name, data.url, data.port),
		editService: (id, data) => editDhtService(id, data.name, data.url, data.port),
		deleteService: deleteDhtService,
		serviceTypeLabel: 'DHT service',
		initialFormState
	});

	// Custom startEdit to handle port extraction
	const startEdit = (service) => {
		// Extract port from URL if present
		let url = service.url;
		let port = '';

		if (url.includes('://')) {
			const urlParts = url.split(':');
			if (urlParts.length > 2) {
				port = urlParts[urlParts.length - 1];
				url = urlParts.slice(0, 2).join(':');
			}
		}

		setNewService({
			name: service.name,
			url: url,
			port: port
		});
		baseStartEdit(service);
	};

	const handleConnect = async (service) => {
		if (!username) {
			setError('Please set your username before connecting');
			return;
		}

		try {
			setConnecting(true);
			setConnected(service._id);
			await connectViaDht(service);
			setConnectedService(service);
		} catch (error) {
			setError(`Failed to connect to DHT service: ${error.message}`);
			setConnected(null);
			setConnectedService(null);
		} finally {
			setConnecting(false);
		}
	};

	const formFields = [
		{ name: 'name', label: 'Name', placeholder: 'My DHT Service' },
		{ name: 'url', label: 'URL', placeholder: 'wss://dht.example.com' },
		{ name: 'port', label: 'Port (optional)', placeholder: '443' }
	];

	const renderForm = () => (
		<ServiceForm
			formData={newService}
			onChange={setNewService}
			onSubmit={handleFormSubmit}
			onCancel={cancelEdit}
			fields={formFields}
			isEditing={!!editing}
			isLoading={loading}
			title="DHT Service"
		/>
	);

	const renderServiceItem = (service) => (
		<ServiceItem
			key={service._id}
			service={service}
			onConnect={() => handleConnect(service)}
			onEdit={() => startEdit(service)}
			onDelete={async () => {
				try {
					await deleteDhtService(service._id);
					loadDhtServices();
				} catch (error) {
					setError(`Failed to delete: ${error.message}`);
				}
			}}
			connecting={connecting && connected === service._id}
			connected={connected === service._id && !connecting}
		/>
	);

	return (
		<>
			<ServiceManager
				title="DHT Services"
				services={dhtServices}
				loading={loading}
				selectedService={connected}
				showAddForm={showForm}
				formValues={{ editing: !!editing }}
				onAdd={() => {
					setShowForm(true);
					setNewService(initialFormState);
				}}
				onCancelEdit={cancelEdit}
				onFormSubmit={handleFormSubmit}
				renderForm={renderForm}
				renderServiceItem={renderServiceItem}
			/>
			{connected && connectedService && (
				<div className="mt-4">
					<PeerList dhtService={connectedService} />
				</div>
			)}
		</>
	);
}

export default DhtServiceManager;