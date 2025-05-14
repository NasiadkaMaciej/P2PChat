const express = require('express');
const router = express.Router();
const IceServer = require('../models/ice-server-model');
const {
	resourceExistsByUrlCheck,
	getAllResources,
	getResourceById,
	deleteResource,
	createResource,
	updateResource
} = require('../utils/crud-helper');

// Get all ICE servers
router.get('/', getAllResources(IceServer));

// Get ICE server by ID
router.get('/:id', getResourceById(IceServer));

// Validate ICE server data
const validateIceServer = (req) => {
	const { name, type, url, username, credential } = req.body;

	// Basic validation
	if (!name || !type || !url) return false;

	const serverType = type.toLowerCase();
	// Additional validation for TURN servers
	if (serverType === 'turn' && (!username || !credential)) return false;

	return {
		name,
		type: serverType,
		url,
		username: serverType === 'turn' ? username : undefined,
		credential: serverType === 'turn' ? credential : undefined
	};
};

// Check if server is a default server
const checkIfDefault = async (server, data) => {
	if (server.isDefault) throw new Error('Default servers cannot be modified');
	return data;
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
	checkIfDefault
));

// Delete an ICE server
router.delete('/:id', deleteResource(IceServer));

// Select an ICE server
router.put('/:id/select', async (req, res) => {
	try {
		const { id } = req.params;
		const server = await IceServer.findById(id);

		if (!server) return res.status(404).json({ error: 'ICE server not found' });

		// Find currently selected server of the same type and deselect it
		const currentlySelected = await IceServer.findOne({
			type: server.type,
			selected: true,
			_id: { $ne: server._id }
		});

		if (currentlySelected) {
			currentlySelected.selected = false;
			await currentlySelected.save();
		}

		// Select the requested server
		server.selected = true;
		await server.save();

		res.json(server);
	} catch (error) {
		console.error('Error selecting ICE server:', error);
		res.status(500).json({ error: 'Error selecting ICE server' });
	}
});

// Deselect an ICE server
router.put('/:id/deselect', async (req, res) => {
	try {
		const { id } = req.params;
		const server = await IceServer.findById(id);

		if (!server) return res.status(404).json({ error: 'ICE server not found' });

		server.selected = false;
		await server.save();

		res.json(server);
	} catch (error) {
		console.error('Error deselecting ICE server:', error);
		res.status(500).json({ error: 'Error deselecting ICE server' });
	}
});

module.exports = router;