const express = require('express');
const cors = require('cors');
const { getIceServers } = require('./services/stun-turn-service');
const DhtService = require('./models/dht-service-model');
const IceServer = require('./models/ice-server-model');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- API Endpoints ---

// Basic health check route
app.get('/', (req, res) => {
	res.send('P2P Chat Backend is running');
});

// Get ICE server configuration
app.get('/api/ice-servers', async (req, res) => {
	try {
		const servers = await getIceServers();
		res.json(servers);
	} catch (error) {
		console.error('Error getting ICE servers:', error);
		res.status(500).json({
			error: 'Error getting ICE servers',
			iceServers: []
		});
	}
});

// Get all ICE servers
app.get('/api/ice-servers/list', async (req, res) => {
	try {
		const servers = await IceServer.find();
		res.json(servers);
	} catch (error) {
		console.error('Error fetching ICE servers:', error);
		res.status(500).json({ error: 'Error fetching ICE servers' });
	}
});

// Add a new ICE server
app.post('/api/ice-servers', async (req, res) => {
	try {
		const { name, type, url, username, credential } = req.body;

		// Basic validation
		if (!name || !type || !url) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Additional validation for TURN servers
		if (type.toLowerCase() === 'turn' && (!username || !credential)) {
			return res.status(400).json({ error: 'TURN servers require username and credential' });
		}

		const newServer = new IceServer({
			name,
			type: type.toLowerCase(),
			url,
			username: type.toLowerCase() === 'turn' ? username : undefined,
			credential: type.toLowerCase() === 'turn' ? credential : undefined
		});

		await newServer.save();
		res.status(201).json(newServer);
	} catch (error) {
		console.error('Error adding ICE server:', error);
		res.status(500).json({ error: 'Error adding ICE server' });
	}
});

// Delete an ICE server
app.delete('/api/ice-servers/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const result = await IceServer.findByIdAndDelete(id);

		if (!result) {
			return res.status(404).json({ error: 'ICE server not found' });
		}

		res.json({ message: 'ICE server deleted successfully' });
	} catch (error) {
		console.error('Error deleting ICE server:', error);
		res.status(500).json({ error: 'Error deleting ICE server' });
	}
});

// Update an ICE server
app.put('/api/ice-servers/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, type, url, username, credential } = req.body;

		// Basic validation
		if (!name || !type || !url) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// Additional validation for TURN servers
		if (type.toLowerCase() === 'turn' && (!username || !credential)) {
			return res.status(400).json({ error: 'TURN servers require username and credential' });
		}

		const server = await IceServer.findById(id);
		if (!server) {
			return res.status(404).json({ error: 'ICE server not found' });
		}

		// Don't allow editing default servers
		if (server.isDefault) {
			return res.status(403).json({ error: 'Default servers cannot be modified' });
		}

		server.name = name;
		server.type = type.toLowerCase();
		server.url = url;
		server.username = type.toLowerCase() === 'turn' ? username : undefined;
		server.credential = type.toLowerCase() === 'turn' ? credential : undefined;

		await server.save();
		res.json(server);
	} catch (error) {
		console.error('Error updating ICE server:', error);
		res.status(500).json({ error: 'Error updating ICE server' });
	}
});

// --- DHT Service Endpoints ---

// Get all DHT services
app.get('/api/dht-services', async (req, res) => {
	try {
		const services = await DhtService.find();
		res.json(services);
	} catch (error) {
		console.error('Error fetching DHT services:', error);
		res.status(500).json({ error: 'Error fetching DHT services' });

	}
});

// Add a new DHT service
app.post('/api/dht-services', async (req, res) => {
	try {
		const { name, url } = req.body;

		if (!name || !url) {
			return res.status(400).json({ error: 'Name and URL are required' });
		}

		// Validate URL
		try {
			new URL(url);
		} catch (e) {
			return res.status(400).json({ error: 'Invalid URL format' });
		}

		// Check if service with this URL exists
		const existingService = await DhtService.findOne({ url });
		if (existingService) {
			return res.status(409).json({ error: 'A DHT service with this URL already exists' });
		}

		const newService = new DhtService({ name, url });
		await newService.save();

		res.status(201).json(newService);
	} catch (error) {
		console.error('Error adding DHT service:', error);
		res.status(500).json({ error: 'Error adding DHT service' });
	}
});

// Update DHT service status (ping)
app.put('/api/dht-services/:id/ping', async (req, res) => {
	try {
		const service = await DhtService.findById(req.params.id);
		if (!service) {
			return res.status(404).json({ error: 'DHT service not found' });
		}

		res.json({ success: true });
	} catch (error) {
		console.error('Error updating DHT service:', error);
		res.status(500).json({ error: 'Error updating DHT service' });
	}
});

// Update a DHT service
app.put('/api/dht-services/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { name, url } = req.body;

		if (!name || !url) {
			return res.status(400).json({ error: 'Name and URL are required' });
		}

		// Validate URL
		try {
			new URL(url);
		} catch (e) {
			return res.status(400).json({ error: 'Invalid URL format' });
		}

		// Check if another service with this URL exists
		const existingService = await DhtService.findOne({
			url,
			_id: { $ne: id }
		});

		if (existingService) {
			return res.status(409).json({ error: 'Another DHT service with this URL already exists' });
		}

		const updatedService = await DhtService.findByIdAndUpdate(
			id,
			{ name, url },
			{ new: true }
		);

		if (!updatedService) {
			return res.status(404).json({ error: 'DHT service not found' });
		}

		res.json(updatedService);
	} catch (error) {
		console.error('Error updating DHT service:', error);
		res.status(500).json({ error: 'Error updating DHT service' });
	}
});

// Select an ICE server (at most one STUN and one TURN)
app.put('/api/ice-servers/:id/select', async (req, res) => {
	try {
		const { id } = req.params;
		const server = await IceServer.findById(id);

		if (!server) {
			return res.status(404).json({ error: 'ICE server not found' });
		}

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
app.put('/api/ice-servers/:id/deselect', async (req, res) => {
	try {
		const { id } = req.params;
		const server = await IceServer.findById(id);

		if (!server) {
			return res.status(404).json({ error: 'ICE server not found' });
		}

		server.selected = false;
		await server.save();

		res.json(server);
	} catch (error) {
		console.error('Error deselecting ICE server:', error);
		res.status(500).json({ error: 'Error deselecting ICE server' });
	}
});

// Delete a DHT service
app.delete('/api/dht-services/:id', async (req, res) => {
	try {
		const result = await DhtService.findByIdAndDelete(req.params.id);
		if (!result) {
			return res.status(404).json({ error: 'DHT service not found' });
		}

		res.json({ success: true });
	} catch (error) {
		console.error('Error deleting DHT service:', error);
		res.status(500).json({ error: 'Error deleting DHT service' });
	}
});

module.exports = app;