const LOCAL_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Generic function to fetch all records of a specific type
export const fetchAll = async (endpoint) => {
	try {
		const response = await fetch(`${LOCAL_BACKEND_URL}${endpoint}`);
		if (!response.ok) throw new Error(`Failed to fetch from ${endpoint}`);
		return await response.json();
	} catch (error) {
		console.error(`Error fetching from ${endpoint}:`, error);
		throw error;
	}
};

// Fetch selected records of a specific type
export const fetchSelected = async (endpoint) => {
	try {
		const response = await fetch(`${LOCAL_BACKEND_URL}${endpoint}/selected`);
		if (!response.ok) throw new Error(`Failed to fetch selected from ${endpoint}`);
		return await response.json();
	} catch (error) {
		console.error(`Error fetching selected from ${endpoint}:`, error);
		throw error;
	}
};

// Toggle selection status of a record
export const toggleSelection = async (endpoint, id) => {
	try {
		const response = await fetch(`${LOCAL_BACKEND_URL}${endpoint}/${id}/toggle-selection`, {
			method: 'PUT',
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || `Failed to toggle selection at ${endpoint}/${id}`);
		}

		return await response.json();
	} catch (error) {
		console.error(`Error toggling selection at ${endpoint}/${id}:`, error);
		throw error;
	}
};

// Generic function to add a record
export const addRecord = async (endpoint, data) => {
	try {
		const response = await fetch(`${LOCAL_BACKEND_URL}${endpoint}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || `Failed to add record to ${endpoint}`);
		}

		return await response.json();
	} catch (error) {
		console.error(`Error adding record to ${endpoint}:`, error);
		throw error;
	}
};

// Generic function to edit a record
export const editRecord = async (endpoint, id, data) => {
	try {
		const response = await fetch(`${LOCAL_BACKEND_URL}${endpoint}/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || `Failed to update record at ${endpoint}/${id}`);
		}

		return await response.json();
	} catch (error) {
		console.error(`Error updating record at ${endpoint}/${id}:`, error);
		throw error;
	}
};

// Generic function to delete a record
export const deleteRecord = async (endpoint, id) => {
	try {
		const response = await fetch(`${LOCAL_BACKEND_URL}${endpoint}/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) throw new Error(`Failed to delete from ${endpoint}/${id}`);
		return await response.json();
	} catch (error) {
		console.error(`Error deleting from ${endpoint}/${id}:`, error);
		throw error;
	}
};

// Generic function to perform an action on a record
export const performAction = async (endpoint, id, action) => {
	try {
		const response = await fetch(`${LOCAL_BACKEND_URL}${endpoint}/${id}/${action}`, {
			method: 'PUT',
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || `Failed to perform ${action} on ${endpoint}/${id}`);
		}

		return await response.json();
	} catch (error) {
		console.error(`Error performing ${action} on ${endpoint}/${id}:`, error);
		throw error;
	}
};