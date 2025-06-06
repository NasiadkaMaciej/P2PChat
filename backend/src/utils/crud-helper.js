/**
 * Utility for handling common CRUD operations
 */

const getResourceName = (Model) => {
	// Simple hardcoded mapping based on model name
	if (Model.modelName === 'IceServer') return 'ICE server';
	else if (Model.modelName === 'DhtService') return 'DHT service';
	else if (Model.modelName === 'TrackerService') return 'Tracker service';
	// Fallback for any other models
	return 'resource';
};

const resourceExistsByUrlCheck = async (Model, data, currentId) => {
	const query = { url: data.url };
	if (currentId) query._id = { $ne: currentId };
	return await Model.findOne(query);
};

const getAllResources = (Model) => async (req, res) => {
	const resourceName = getResourceName(Model);
	try {
		const items = await Model.find();
		res.json(items);
	} catch (error) {
		const errorMessage = `Failed to retrieve ${resourceName} list`;
		console.error(`Error: ${errorMessage}`, error);
		res.status(500).json({ error: errorMessage });
	}
};

const getResourceById = (Model) => async (req, res) => {
	const resourceName = getResourceName(Model);
	try {
		const item = await Model.findById(req.params.id);
		if (!item) return res.status(404).json({ error: `${resourceName} not found` });
		res.json(item);
	} catch (error) {
		const errorMessage = `Failed to retrieve ${resourceName}`;
		console.error(`Error: ${errorMessage}`, error);
		res.status(500).json({ error: errorMessage });
	}
};

const deleteResource = (Model) => async (req, res) => {
	const resourceName = getResourceName(Model);
	try {
		const result = await Model.findByIdAndDelete(req.params.id);
		if (!result) return res.status(404).json({ error: `${resourceName} not found` });
		res.json({ message: `${resourceName} deleted successfully` });
	} catch (error) {
		const errorMessage = `Failed to delete ${resourceName}`;
		console.error(`Error: ${errorMessage}`, error);
		res.status(500).json({ error: errorMessage });
	}
};

const createResource = (Model, validateFn, existsCheckFn) => async (req, res) => {
	const resourceName = getResourceName(Model);
	try {
		// Call validation function to get validated data
		const data = validateFn(req);
		if (!data) return res.status(400).json({ error: `Invalid ${resourceName} data` });

		// Check if resource already exists
		if (existsCheckFn) {
			const exists = await existsCheckFn(Model, data, null);
			if (exists) return res.status(409).json({ error: `A ${resourceName} with these details already exists` });
		}

		// Create and save new resource
		const newResource = new Model(data);
		await newResource.save();

		res.status(201).json(newResource);
	} catch (error) {
		const errorMessage = `Failed to create ${resourceName}`;
		console.error(`Error: ${errorMessage}`, error);
		res.status(500).json({ error: errorMessage });
	}
};

const updateResource = (Model, validateFn, existsCheckFn, beforeSaveFn) => async (req, res) => {
	const resourceName = getResourceName(Model);
	try {
		const { id } = req.params;

		// Call validation function to get validated data
		const data = validateFn(req);
		if (!data) return res.status(400).json({ error: `Invalid ${resourceName} data` });

		// Check if resource exists
		const resource = await Model.findById(id);
		if (!resource) return res.status(404).json({ error: `${resourceName} not found` });

		// Check for duplicate
		if (existsCheckFn) {
			const exists = await existsCheckFn(Model, data, id);
			if (exists) return res.status(409).json({ error: `Another ${resourceName} with these details already exists` });
		}

		// Run custom logic before saving if provided
		if (beforeSaveFn) await beforeSaveFn(resource, data);

		// Update resource
		Object.assign(resource, data);
		await resource.save();

		res.json(resource);
	} catch (error) {
		const errorMessage = `Failed to update ${resourceName}`;
		console.error(`Error: ${errorMessage}`, error);
		res.status(500).json({ error: errorMessage });
	}
};

// Get only selected resources
const getSelectedResources = (Model) => async (req, res) => {
	const resourceName = getResourceName(Model);
	try {
		const items = await Model.find({ selected: true });
		res.json(items);
	} catch (error) {
		const errorMessage = `Failed to retrieve selected ${resourceName} list`;
		console.error(`Error: ${errorMessage}`, error);
		res.status(500).json({ error: errorMessage });
	}
};

// Toggle selection status of a resource
const toggleResourceSelection = (Model) => async (req, res) => {
	const resourceName = getResourceName(Model);
	const { id } = req.params;

	try {
		const resource = await Model.findById(id);
		if (!resource) {
			return res.status(404).json({ error: `${resourceName} not found` });
		}

		// Toggle the selected status
		resource.selected = !resource.selected;
		await resource.save();

		res.json(resource);
	} catch (error) {
		const errorMessage = `Failed to toggle selection for ${resourceName}`;
		console.error(`Error: ${errorMessage}`, error);
		res.status(500).json({ error: errorMessage });
	}
};

module.exports = {
	resourceExistsByUrlCheck,
	getAllResources,
	getResourceById,
	deleteResource,
	createResource,
	updateResource,
	getSelectedResources,
	toggleResourceSelection
};