const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3479;

// Middleware
app.use(cors());
app.use(express.json());


// In-memory storage for peers and signals
// In production, you would use Redis or another distributed storage
const peers = new Map();
const signals = new Map();

// Clean up inactive peers periodically (120 seconds timeout)
const PEER_TIMEOUT_MS = 120 * 1000;
setInterval(() => {
	const now = Date.now();
	for (const [peerId, peer] of peers.entries()) {
		if (now - peer.lastSeen > PEER_TIMEOUT_MS) {
			console.log(`Removing inactive peer: ${peerId}`);
			peers.delete(peerId);
		}
	}
}, 30000); // Check every 30 seconds

// Register a peer
app.post('/register', (req, res) => {
	try {
		const { peerId, name } = req.body;

		if (!peerId || !name) {
			return res.status(400).json({ error: 'Peer ID and name are required' });
		}

		// Create or update peer
		peers.set(peerId, {
			peerId,
			name,
			lastSeen: Date.now()
		});

		console.log(`Peer registered: ${peerId} (${name})`);
		res.status(201).json({ peerId, success: true });
	} catch (error) {
		console.error('Error registering peer:', error);
		res.status(500).json({ error: 'Failed to register peer' });
	}
});

// Get all peers
app.get('/peers', (req, res) => {
	try {
		// Convert the Map to an array of peer objects
		const peersArray = Array.from(peers.values());

		console.log(`Returning ${peersArray.length} peers`);
		res.json(peersArray);
	} catch (error) {
		console.error('Error retrieving peers:', error);
		res.status(500).json({ error: 'Failed to retrieve peers' });
	}
});

// Signal exchange endpoint
app.post('/signal', (req, res) => {
	try {
		const { from, to, type, payload } = req.body;

		if (!from || !to || !type || !payload) {
			return res.status(400).json({
				error: 'Missing required fields: from, to, type, payload'
			});
		}

		// Store the signal
		const signalId = `${from}-${to}-${Date.now()}`;
		signals.set(signalId, { from, to, type, payload, timestamp: Date.now() });

		// Add signal to queue for recipient
		const recipientSignals = signals.get(to) || [];
		recipientSignals.push(signalId);
		signals.set(to, recipientSignals);

		console.log(`Signal stored: ${type} from ${from} to ${to}`);
		res.status(201).json({ success: true, signalId });
	} catch (error) {
		console.error('Error storing signal:', error);
		res.status(500).json({ error: 'Failed to store signal' });
	}
});

// Get signals for a peer
app.get('/signal/:peerId', (req, res) => {
	try {
		const { peerId } = req.params;
		const signalIds = signals.get(peerId) || [];

		// No signals for this peer
		if (!signalIds.length) {
			return res.json([]);
		}

		// Get signals
		const peerSignals = signalIds.map(id => signals.get(id)).filter(Boolean);

		// Clear signals for this peer
		signals.set(peerId, []);

		res.json(peerSignals);
	} catch (error) {
		console.error('Error fetching signals:', error);
		res.status(500).json({ error: 'Failed to fetch signals' });
	}
});

// Health check endpoint
app.get('/health', (req, res) => {
	res.json({ status: 'healthy', timestamp: Date.now() });
});

// Start the server
app.listen(PORT, () => {
	console.log(`DHT service running on port ${PORT}`);
});