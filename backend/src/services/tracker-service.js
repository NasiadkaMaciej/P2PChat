const TrackerService = require('../models/tracker-service-model');

const getTrackerServices = async () => {
	try {
		// Get trackers from database
		const trackers = await TrackerService.find({});

		if (trackers.length === 0) {
			return { trackers: [] };
		}

		// Process trackers
		const formattedTrackers = trackers.map(tracker => ({
			_id: tracker._id,
			name: tracker.name,
			url: tracker.url,
			isDefault: tracker.isDefault
		}));

		return {
			trackers: formattedTrackers,
			count: formattedTrackers.length
		};
	} catch (error) {
		console.error('Error fetching tracker services:', error);
		return { trackers: [], count: 0 };
	}
};

module.exports = { getTrackerServices };