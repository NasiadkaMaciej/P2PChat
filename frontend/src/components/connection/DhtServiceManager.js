'use client';
import React, { useState } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { fetchDhtServices, addDhtService, editDhtService, deleteDhtService } from '@/services/dht-service.js';
import { useUserName } from '@/services/user-service';
import { connectViaDht } from '@/services/signaling-service';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import GenericServiceManager from '../ui/GenericServiceManager';
import PeerList from './PeerList';

function DhtServiceManager() {
	const { setError } = useConnection();
	const username = useUserName();
	const [connected, setConnected] = useState(null);
	const [connectedService, setConnectedService] = useState(null);
	const { loading: connecting, execute } = useAsyncAction();

	const initialFormState = {
		name: '',
		url: ''
	};

	const formFields = [
		{ name: 'name', label: 'Name', placeholder: 'My DHT Service' },
		{ name: 'url', label: 'URL', placeholder: 'http://dht.example.com:3478' }
	];

	const handleConnect = async (service) => {
		if (!username) {
			setError('Please set your username before connecting');
			return;
		}

		try {
			await execute(
				() => connectViaDht(service),
				"connect to DHT service",
				() => {
					setConnected(service._id);
					setConnectedService(service);
				}
			);
		} catch (error) {
			setConnected(null);
			setConnectedService(null);
		}
	};

	return (
		<GenericServiceManager
			title="DHT Services"
			serviceTypeLabel="DHT Service"
			initialFormState={initialFormState}
			fetchServices={fetchDhtServices}
			addService={(data) => addDhtService(data.name, data.url)}
			editService={(id, data) => editDhtService(id, data.name, data.url)}
			deleteService={deleteDhtService}
			onConnect={handleConnect}
			formFields={formFields}
			connected={connected}
			connecting={connecting}
			connectedId={connected}
			additionalContent={connected && connectedService && (
				<div className="mt-4">
					<PeerList dhtService={connectedService} />
				</div>
			)}
		/>
	);
}

export default DhtServiceManager;