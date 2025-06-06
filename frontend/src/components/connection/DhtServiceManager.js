'use client';
import React, { useState } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { useUserName } from '@/services/user-service';
import { connectViaDht } from '@/services/signaling-service';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import GenericServiceManager from '../ui/GenericServiceManager';
import PeerList from './PeerList';
import { dhtServiceConfig } from '@/services/service-configs';

function DhtServiceManager() {
	const { setError } = useConnection();
	const username = useUserName();
	const [connected, setConnected] = useState(null);
	const [connectedService, setConnectedService] = useState(null);
	const { loading: connecting, execute } = useAsyncAction();

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
			{...dhtServiceConfig}
			onConnect={handleConnect}
			connected={connected}
			connecting={connecting}
			connectedId={connected}
			enableSelection={false}
			additionalContent={connectedService && connected && (
				<PeerList
					dhtService={connectedService}
				/>
			)}
		/>
	);
}

export default DhtServiceManager;