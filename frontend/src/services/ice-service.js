import { fetchAll, addRecord, editRecord, deleteRecord, performAction } from './api-service';

const LOCAL_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Fetch all available ICE servers
export const fetchIceServers = async () => {
	return fetchAll('/api/ice-servers/list');
};

// Add a new ICE server
export const addIceServer = async (name, type, url, username, credential) => {
	return addRecord('/api/ice-servers', { name, type, url, username, credential });
};

// Edit an ICE server
export const editIceServer = async (id, name, type, url, username, credential) => {
	return editRecord('/api/ice-servers', id, { name, type, url, username, credential });
};

// Delete an ICE server
export const deleteIceServer = async (id) => {
	return deleteRecord('/api/ice-servers', id);
};

// Select an ICE server
export const selectIceServer = async (id) => {
	return performAction('/api/ice-servers', id, 'select');
};

// Deselect an ICE server
export const deselectIceServer = async (id) => {
	return performAction('/api/ice-servers', id, 'deselect');
};