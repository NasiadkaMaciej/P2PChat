"use client";

import React, { useState, useEffect } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { fetchAll, addRecord, editRecord, deleteRecord } from '../../services/api-service';
import GenericServiceManager from '../ui/GenericServiceManager';

// Fetch all available tracker services
const fetchTrackerServices = async () => {
	try {
		const response = await fetchAll('/api/tracker-services');
		return response.map(tracker => ({
			_id: tracker._id,
			name: tracker.name || tracker.url,
			url: tracker.url,
			isDefault: tracker.isDefault || false
		}));
	} catch (error) {
		console.error('Failed to fetch tracker services:', error);
		return [];
	}
};

// Add a new tracker service
const addTrackerService = async (name, url) => {
	return addRecord('/api/tracker-services', { name, url });
};

// Edit a tracker service
const editTrackerService = async (id, name, url) => {
	return editRecord('/api/tracker-services', id, { name, url });
};

// Delete a tracker service
const deleteTrackerService = async (id) => {
	return deleteRecord('/api/tracker-services', id);
};

function TrackerServiceManager() {
	const { execute } = useAsyncAction();
	const [selectedTrackers, setSelectedTrackers] = useState([]);

	// Load selected trackers from localStorage or select defaults
	useEffect(() => {
		const saved = localStorage.getItem('selectedTrackers');
		if (saved) {
			try {
				setSelectedTrackers(JSON.parse(saved));
			} catch (e) {
				console.error('Invalid tracker data in localStorage');
				setSelectedTrackers([]);
			}
		} else {
			// If no selection exists, fetch and select default trackers
			const selectDefaults = async () => {
				try {
					const trackers = await fetchTrackerServices();
					if (trackers && trackers.length > 0) {
						const defaultTrackerIds = trackers
							.filter(tracker => tracker.isDefault)
							.map(tracker => tracker._id);

						if (defaultTrackerIds.length > 0) {
							saveSelectedTrackers(defaultTrackerIds);
						}
					}
				} catch (error) {
					console.error('Error selecting default trackers:', error);
				}
			};

			selectDefaults();
		}
	}, []);

	// Save selected trackers to localStorage - store just IDs like in IceServerManager
	const saveSelectedTrackers = (trackerIds) => {
		localStorage.setItem('selectedTrackers', JSON.stringify(trackerIds));
		setSelectedTrackers(trackerIds);

		// Notify other components about tracker changes
		window.dispatchEvent(new CustomEvent('trackers-changed', {
			detail: { trackerIds }
		}));
	};

	const initialFormState = {
		name: '',
		url: ''
	};

	const formFields = [
		{ name: 'name', label: 'Name', type: 'text', placeholder: 'My Tracker', required: true },
		{ name: 'url', label: 'URL', type: 'text', placeholder: 'wss://tracker.example.com', required: true }
	];

	const handleSelectTracker = async (tracker) => {
		try {
			const isSelected = selectedTrackers.includes(tracker._id);
			let newSelection;

			if (isSelected) {
				newSelection = selectedTrackers.filter(id => id !== tracker._id);
			} else {
				newSelection = [...selectedTrackers, tracker._id];
			}

			saveSelectedTrackers(newSelection);
			return true; // Signal success to trigger reload
		} catch (error) {
			console.error('Error handling tracker selection:', error);
			return false;
		}
	};

	const isTrackerSelected = (tracker) => {
		return selectedTrackers.includes(tracker._id);
	};

	return (
		<div className="mb-8">
			<GenericServiceManager
				title="WebTorrent Trackers"
				serviceTypeLabel="Tracker"
				initialFormState={initialFormState}
				fetchServices={fetchTrackerServices}
				addService={(data) => addTrackerService(data.name, data.url)}
				editService={(id, data) => editTrackerService(id, data.name, data.url)}
				deleteService={deleteTrackerService}
				onSelect={handleSelectTracker}
				formFields={formFields}
				isSelected={isTrackerSelected}
				helpContent={
					<>
						<h4 className="font-medium mb-2">What are WebTorrent Trackers?</h4>
						<p className="mb-3">
							WebTorrent trackers help coordinate peer connections for file transfers in p2pChat.
							They only facilitate the initial connection between peers and don't see any of your
							file content.
						</p>

						<h4 className="font-medium mb-2">How Trackers Work</h4>
						<p className="mb-3">
							When sending a file, your client announces to the tracker that it has a file to share.
							The tracker then helps other peers find and connect to you to download the file directly
							through WebRTC.
						</p>

						<h4 className="font-medium mb-2">Multiple Trackers</h4>
						<p>
							Using multiple trackers improves reliability. If one tracker is unavailable,
							connections can still be established through the others.
						</p>
					</>
				}
			/>
		</div>
	);
}

export default TrackerServiceManager;