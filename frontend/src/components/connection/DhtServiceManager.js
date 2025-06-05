'use client';
import React, { useState } from 'react';
import { useConnection } from '@/context/ConnectionContext';
import { fetchDhtServices, addDhtService, editDhtService, deleteDhtService } from '@/services/dht-service.js';
import { useUserName } from '@/services/user-service';
import { connectViaDht } from '@/services/signaling-service';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import GenericServiceManager from '../ui/GenericServiceManager';
import PeerList from './PeerList';
import HelpPopup from '../ui/HelpPopup';

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
			helpContent={
				<>
					<h4 className="font-medium mb-2">What is a DHT Service?</h4>
					<p className="mb-3">
						A DHT (Distributed Hash Table) service helps peers discover each other and exchange
						connection data automatically without requiring manual copying and pasting of connection information.
					</p>

					<h4 className="font-medium mb-2">How It Works</h4>
					<p className="mb-3">
						When you connect to a DHT service, your peer registers with the service and gets a unique ID.
						Other peers can discover your ID through the same DHT service, allowing automatic connection
						negotiation.
					</p>

					<h4 className="font-medium mb-2">Privacy Considerations</h4>
					<p>
						The DHT service can see that peers are connecting, but all WebRTC data is still
						transmitted directly between peers. For maximum privacy, you can host your own DHT
						service using the simple Node.js implementation described in the documentation.
					</p>
				</>
			}
			additionalContent={connected && connectedService && (
				<div className="mt-4">
					<div className="flex items-center mb-2">
						<h4 className="text-sm font-medium text-white">Peer List</h4>
						<HelpPopup title="Peer List">
							<p className="mb-3">
								The peer list shows all other users currently connected to the same DHT service.
								You can connect to any of these peers directly by clicking the "Connect" button.
							</p>
							<p>
								When someone wants to connect to you, you'll receive a connection request that you
								can accept or reject. All chat data is transmitted directly between peers without
								going through the DHT service.
							</p>
						</HelpPopup>
					</div>
					<PeerList dhtService={connectedService} />
				</div>
			)}
		/>
	);
}

export default DhtServiceManager;