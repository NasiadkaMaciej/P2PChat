const express = require('express');
const cors = require('cors');
const { getIceServers } = require('./services/stun-turn-service');

const iceServerRoutes = require('./routes/ice-server-routes');
const dhtServiceRoutes = require('./routes/dht-service-routes');

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

// Mount routes
app.use('/api/ice-servers', iceServerRoutes);
app.use('/api/dht-services', dhtServiceRoutes);

module.exports = app;