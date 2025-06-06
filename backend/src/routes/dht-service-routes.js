const express = require('express');
const router = express.Router();
const DhtService = require('../models/dht-service-model');
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

// Get all DHT services
router.get('/', getAllResources(DhtService));

// Get selected DHT services
router.get('/selected', getSelectedResources(DhtService));

// Toggle selection status
router.put('/:id/toggle-selection', toggleResourceSelection(DhtService));

// Get DHT service by ID
router.get('/:id', getResourceById(DhtService));

// Validate DHT service data
const validateDhtService = (req) => {
	const { name, url } = req.body;
	if (!name || !url) return false;

	// Validate URL
	try {
		new URL(url);
		return { name, url };
	} catch (e) {
		return false;
	}
};

// Add a new DHT service
router.post('/', createResource(
	DhtService,
	validateDhtService,
	(Model, data, currentId) => resourceExistsByUrlCheck(Model, data, currentId)
));

// Update a DHT service
router.put('/:id', updateResource(
	DhtService,
	validateDhtService,
	(Model, data, currentId) => resourceExistsByUrlCheck(Model, data, currentId)
));

// Delete a DHT service
router.delete('/:id', deleteResource(DhtService));

// Update DHT service status (ping)
router.put('/:id/ping', async (req, res) => {
	try {
		const service = await DhtService.findById(req.params.id);
		if (!service) return res.status(404).json({ error: 'DHT service not found' });

		res.json({ success: true });
	} catch (error) {
		console.error('Error updating DHT service:', error);
		res.status(500).json({ error: 'Error updating DHT service' });
	}
});

module.exports = router;