const express = require('express');
const router = express.Router();
const TrackerService = require('../models/tracker-service-model');
const {
	resourceExistsByUrlCheck,
	getAllResources,
	getResourceById,
	createResource,
	updateResource,
	deleteResource
} = require('../utils/crud-helper');

// Get all tracker services
router.get('/', getAllResources(TrackerService));

// Get tracker service by ID
router.get('/:id', getResourceById(TrackerService));

// Validate tracker service data
const validateTrackerService = (req) => {
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

// Add a new tracker service
router.post('/', createResource(
	TrackerService,
	validateTrackerService,
	(Model, data, currentId) => resourceExistsByUrlCheck(Model, data, currentId)
));

// Update a tracker service
router.put('/:id', updateResource(
	TrackerService,
	validateTrackerService,
	(Model, data, currentId) => resourceExistsByUrlCheck(Model, data, currentId)
));

// Delete a tracker service - using standard delete handler
router.delete('/:id', deleteResource(TrackerService));

module.exports = router;