const mongoose = require('mongoose');
const DhtService = require('../models/dht-service-model');

// MongoDB connection string from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
const DEFAULT_DHT_SERVICES = process.env.DEFAULT_DHT_SERVICES;

async function initializeDefaultDht() {
	try {
		console.log('Initializing DHT services...');
		console.log(`Using MongoDB URI: ${MONGODB_URI}`);
		console.log(`Using DHT URLs: ${DEFAULT_DHT_SERVICES}`);

		await mongoose.connect(MONGODB_URI);
		console.log('Connected to MongoDB');

		// Check if the database is empty
		const count = await DhtService.countDocuments();

		if (count === 0) {
			console.log('DHT service collection is empty. Adding default services...');

			// Parse the comma-separated list of DHT services
			const dhtUrls = DEFAULT_DHT_SERVICES.split(',').map(url => url.trim());

			// Create each DHT service
			for (const [index, dhtUrl] of dhtUrls.entries()) {
				// Extract hostname for service name
				let name = `DHT Service ${index + 1}`;
				try {
					const url = new URL(dhtUrl);
					name = `${url.hostname} DHT Service`;
				} catch (e) {
					console.log(`Could not parse URL: ${dhtUrl}`);
				}

				console.log(`Creating DHT service: ${dhtUrl}`);
				await DhtService.create({
					name: name,
					url: dhtUrl,
					isDefault: true,
				});
				console.log(`Created default DHT service with URL: ${dhtUrl}`);
			}
			console.log('Added all default DHT services successfully!');
		} else
			console.log(`Found ${count} existing DHT services. Skipping default initialization.`);

		await mongoose.disconnect();
		console.log('Disconnected from MongoDB');
		console.log('DHT initialization process completed!');
	} catch (error) {
		console.error('Error initializing DHT:', error);
		process.exit(1);
	}
}

// Run the initialization function
initializeDefaultDht();