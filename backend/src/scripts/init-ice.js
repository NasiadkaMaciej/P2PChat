/**
 * Script to initialize default ICE servers from environment variables
 */
const mongoose = require('mongoose');
const IceServer = require('../models/ice-server-model');

async function initIceServers() {
	console.log('Initializing default ICE servers...');

	try {
		// Connect to database
		const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
		await mongoose.connect(mongoUri);
		console.log('Connected to MongoDB');

		// Check if the database is empty first
		const count = await IceServer.countDocuments();

		if (count === 0) {
			console.log('ICE server collection is empty. Adding default servers...');

			// Add default STUN servers
			const stunServers = process.env.STUN_SERVERS?.split(',') || [];
			for (const stunUrl of stunServers) {
				if (!stunUrl.trim()) continue;

				try {
					const hostname = new URL(stunUrl.trim()).hostname;
					await IceServer.create({
						name: `Default STUN Server (${hostname})`,
						type: 'stun',
						url: stunUrl.trim(),
						isDefault: true,
						selected: true // Select the default STUN server
					});
					console.log(`Added default STUN server: ${stunUrl.trim()}`);
				} catch (error) {
					console.error(`Error adding default STUN server ${stunUrl}:`, error);
				}
			}

			// Add default TURN server
			const turnServerUrl = process.env.TURN_SERVER_URL;
			const username = process.env.TURN_SERVER_USERNAME;
			const credential = process.env.TURN_SERVER_CREDENTIAL;

			if (turnServerUrl && username && credential) {
				try {
					const hostname = new URL(turnServerUrl).hostname;
					await IceServer.create({
						name: `Default TURN Server (${hostname})`,
						type: 'turn',
						url: turnServerUrl,
						username,
						credential,
						isDefault: true,
						selected: true // Select the default TURN server
					});
					console.log(`Added default TURN server: ${turnServerUrl}`);
				} catch (error) {
					console.error(`Error adding default TURN server ${turnServerUrl}:`, error);
				}
			}
		} else {
			console.log(`Found ${count} existing ICE servers. Skipping initialization.`);
		}

		console.log('Default ICE servers initialization complete.');
	} catch (error) {
		console.error('Error initializing ICE servers:', error);
	} finally {
		await mongoose.disconnect();
		console.log('Disconnected from MongoDB');
	}
}

// Run if this script is executed directly
if (require.main === module) {
	initIceServers();
}

module.exports = { initIceServers };