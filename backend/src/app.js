const express = require('express');
const cors = require('cors');
const { getIceServers } = require('./services/stun-turn-service');
const DhtService = require('./models/dht-service-model');

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
app.get('/api/ice-servers', (req, res) => {
	res.json(getIceServers());
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
		const { name, url, port } = req.body;

		if (!name || !url) {
			return res.status(400).json({ error: 'Name and URL are required' });
		}

		// Construct the full URL with port if provided
		let fullUrl = url;
		if (port) {
			try {
				const urlObj = new URL(url);
				urlObj.port = port;
				fullUrl = urlObj.toString();
			} catch (e) {
				// If URL parsing fails, try a simpler approach
				fullUrl = `${url}:${port}`;
			}
		}

		// Validate URL
		try {
			new URL(fullUrl);
		} catch (e) {
			return res.status(400).json({ error: 'Invalid URL format' });
		}

		const existingService = await DhtService.findOne({ url: fullUrl });
		if (existingService) {
			return res.status(409).json({ error: 'A DHT service with this URL already exists' });
		}

		const newService = new DhtService({ name, url: fullUrl });
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