const express = require('express');
const router = express.Router();
const IceServer = require('../models/ice-server-model');
const {
	resourceExistsByUrlCheck,
	getAllResources,
	getResourceById,
	deleteResource,
	createResource,
	updateResource,
	getSelectedResources,
	toggleResourceSelection
} = require('../utils/crud-helper');

// Get all ICE servers
router.get('/', getAllResources(IceServer));

// Get selected ICE servers
router.get('/selected', getSelectedResources(IceServer));

// Toggle selection status
router.put('/:id/toggle-selection', toggleResourceSelection(IceServer));

// Get ICE server by ID
router.get('/:id', getResourceById(IceServer));

// Validate ICE server data
const validateIceServer = (req) => {
	const { name, type, url, username, credential } = req.body;

	// Basic validation
	if (!name || !type || !url) return false;

	const serverType = type.toLowerCase();

	if (serverType === 'turn' && (!username || !credential)) return false;

	const serverData = {
		name,
		type: serverType,
		url
	};

	// Only add these fields for TURN servers
	if (serverType === 'turn') {
		serverData.username = username;
		serverData.credential = credential;
	}

	return serverData;
};

// Add a new ICE server
router.post('/', createResource(
	IceServer,
	validateIceServer,
	(Model, data, currentId) => resourceExistsByUrlCheck(Model, data, currentId)
));

// Update an ICE server
router.put('/:id', updateResource(
	IceServer,
	validateIceServer,
	(Model, data, currentId) => resourceExistsByUrlCheck(Model, data, currentId),
));

// Delete an ICE server
router.delete('/:id', deleteResource(IceServer));

module.exports = router;