'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnection } from '@/context/ConnectionContext';
import Button from '../ui/Button';
import { connectViaDht } from '@/services/signaling-service';
import {
	fetchDhtServices,
	addDhtService,
	deleteDhtService,
} from '@/services/dht-service.js';
import { fadeIn, slideIn } from '@/utils/animation-utils';
import PeerList from './PeerList';

// Then update the component
function DhtServiceManager() {
	const { connectionMethod, selectedDht, setSelectedDht, setError } = useConnection();
	const [dhtServices, setDhtServices] = useState([]);
	const [newService, setNewService] = useState({ name: '', url: '' });
	const [loading, setLoading] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState(null);
	const [dhtConnected, setDhtConnected] = useState(false);

	// Only fetch when using DHT connection method
	useEffect(() => {
		if (connectionMethod === 'dht') {
			loadDhtServices();
		}
	}, [connectionMethod]);

	// Load DHT services from backend
	const loadDhtServices = async () => {
		try {
			setLoading(true);
			const services = await fetchDhtServices();
			setDhtServices(services);

			// Clear selected DHT if it no longer exists
			if (selectedDht && !services.find(s => s._id === selectedDht._id)) {
				setSelectedDht(null);
			}
		} catch (error) {
			setError(`Failed to load DHT services: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// When handling DHT selection
	const handleDhtSelect = async (service) => {
		setSelectedDht(service);
		setConnectionStatus('connecting');

		try {
			const result = await connectViaDht(service);
			setConnectionStatus(result.status);

			// Store own peer ID for later use
			if (result.peerId) {
				window._ownPeerId = result.peerId;
			}

			// If connected to DHT successfully
			if (result.status === 'connected_to_dht') {
				setDhtConnected(true);
			}

		} catch (error) {
			setError(`DHT connection failed: ${error.message}`);
			setConnectionStatus('error');
		}
	};

	// Handle adding a new service
	const handleAddService = async (e) => {
		e.preventDefault();
		if (!newService.name || !newService.url) {
			setError('Name and URL are required');
			return;
		}

		try {
			setLoading(true);
			await addDhtService(newService.name, newService.url);
			setNewService({ name: '', url: '' });
			setShowAddForm(false);
			loadDhtServices();
		} catch (error) {
			setError(`Failed to add DHT service: ${error.message}`);
		} finally {
			setLoading(false);
		}
	};

	// Only render for DHT connection method
	if (connectionMethod !== 'dht') return null;

	return (
		<motion.div
			className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4"
			{...fadeIn}
		>
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-xl font-medium text-white">DHT Services</h3>
				<Button
					onClick={() => setShowAddForm(!showAddForm)}
					variant={showAddForm ? "secondary" : "primary"}
				>
					{showAddForm ? 'Cancel' : 'Add New'}
				</Button>
			</div>

			{/* Add Service Form */}
			<AnimatePresence>
				{showAddForm && (
					<motion.form
						{...slideIn('up')}
						className="mb-4 p-4 bg-gray-700 rounded-md overflow-hidden"
						onSubmit={handleAddService}
					>
						<motion.div className="mb-4 p-3 bg-gray-700 rounded text-sm">
							<h4 className="font-medium mb-2">How to host your own DHT server:</h4>
							<ol className="list-decimal pl-5 space-y-1 text-gray-300">
								<li>Deploy the DHT service container from this project</li>
								<li>Configure an NGINX reverse proxy with HTTPS</li>
								<li>Add your domain in the form below using an HTTPS URL</li>
							</ol>
						</motion.div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Service Name</label>
								<input
									type="text"
									value={newService.name}
									onChange={(e) => setNewService({ ...newService, name: e.target.value })}
									className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
									placeholder="My DHT Service"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-400 mb-1">Service URL</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={newService.url}
										onChange={(e) => setNewService({ ...newService, url: e.target.value })}
										className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
										placeholder="https://dht.example.com"
									/>
									<input
										type="text"
										value={newService.port || ""}
										onChange={(e) => {
											const port = e.target.value.trim();
											setNewService({
												...newService,
												port: port,
												url: port ? newService.url.split(':').slice(0, 2).join(':') + ':' + port : newService.url.split(':').slice(0, 2).join(':')
											});
										}}
										className="w-20 p-2 bg-gray-800 border border-gray-600 rounded text-white"
										placeholder="Port"
									/>
								</div>
							</div>
						</div>
						<div className="mt-4 flex justify-end">
							<Button type="submit" disabled={loading}>
								{loading ? 'Adding...' : 'Add Service'}
							</Button>
						</div>
					</motion.form>
				)}
			</AnimatePresence>

			{/* Connection Status */}
			{connectionStatus && (
				<motion.div
					className="mt-2 p-2 bg-gray-700 rounded text-sm"
					{...fadeIn}
				>
					{connectionStatus === 'waiting' ?
						'Waiting for other peers to connect...' :
						`Connection status: ${connectionStatus}`}
				</motion.div>
			)}

			{/* Service List */}
			{loading ? (
				<div className="text-center py-4">
					<div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
				</div>
			) : (
				<div className="space-y-3">
					{dhtServices.map(service => (
						<React.Fragment key={service.id || service.url}>
							<ServiceItem
								key={service._id}
								service={service}
								isSelected={selectedDht && selectedDht._id === service._id}
								onSelect={() => handleDhtSelect(service)}
								onDelete={async () => {
									try {
										await deleteDhtService(service._id);
										if (selectedDht && selectedDht._id === service._id) {
											setSelectedDht(null);
										}
										loadDhtServices();
									} catch (error) {
										setError(`Failed to delete: ${error.message}`);
									}
								}}
							/>
							{/* Show PeerList component when connected to DHT */}
							{dhtConnected && selectedDht && (
								<PeerList dhtService={selectedDht} />
							)}
						</React.Fragment>
					))}
				</div>
			)}
		</motion.div>
	);
}

function ServiceItem({ service, isSelected, onSelect, onDelete }) {
	// Parse URL to extract port information
	const urlObj = new URL(service.url);
	const portInfo = urlObj.port ? `:${urlObj.port}` : '';
	const displayUrl = `${urlObj.protocol}//${urlObj.hostname}${portInfo}`;

	return (
		<motion.div
			className={`p-3 rounded-md border ${isSelected ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-800/50'}`}
			{...fadeIn}
		>
			<div className="flex justify-between items-center">
				<div>
					<h4 className="font-medium text-white">{service.name}</h4>
					<p className="text-sm text-gray-400">{displayUrl}</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={onSelect}
						variant={isSelected ? "secondary" : "primary"}
						disabled={isSelected}
					>
						{isSelected ? 'Selected' : 'Select'}
					</Button>

					<Button onClick={onDelete} variant="danger">
						Delete
					</Button>
				</div>
			</div>
		</motion.div>
	);
}

export default DhtServiceManager;