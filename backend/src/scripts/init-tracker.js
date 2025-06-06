const mongoose = require('mongoose');
const TrackerService = require('../models/tracker-service-model');

// MongoDB connection string from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
const DEFAULT_TRACKER_URL = process.env.DEFAULT_TRACKER_URL || 'ws://torrent2.nasiadka.pl:32265';
const DEFAULT_TRACKER_NAME = process.env.DEFAULT_TRACKER_NAME || 'P2P Chat Default Tracker';

async function initTrackerServices() {
	try {
		console.log('Initializing tracker services...');
		console.log(`Using MongoDB URI: ${MONGODB_URI}`);

		// Only connect if not already connected
		if (mongoose.connection.readyState !== 1) {
			await mongoose.connect(MONGODB_URI);
			console.log('Connected to MongoDB');
		}

		// Check if there are any existing tracker services
		const count = await TrackerService.countDocuments();

		if (count === 0) {
			console.log('No tracker services found. Adding default trackers...');

			// Default tracker from environment variables
			const defaultTracker = {
				name: DEFAULT_TRACKER_NAME,
				url: DEFAULT_TRACKER_URL,
				isDefault: true,
				selected: true
			};

			try {
				await TrackerService.create(defaultTracker);
				console.log(`Added default tracker: ${defaultTracker.name} (${defaultTracker.url})`);
			} catch (error) {
				console.error(`Error adding default tracker ${defaultTracker.url}:`, error);
			}

			console.log('Added default tracker service successfully!');
		} else
			console.log(`Found ${count} existing tracker services. Skipping initialization.`);

		// Close connection if this script is executed directly
		if (require.main === module) {
			await mongoose.disconnect();
			console.log('Disconnected from MongoDB');
		}

		console.log('Tracker services initialization complete.');
	} catch (error) {
		console.error('Error initializing tracker services:', error);
		if (require.main === module) {
			process.exit(1);
		}
	}
}

// Run the initialization function when script is executed directly
if (require.main === module) {
	initTrackerServices();
}

module.exports = { initTrackerServices };