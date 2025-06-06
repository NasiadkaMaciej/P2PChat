const TrackerService = require('../models/tracker-service-model');

const getTrackerServices = async () => {
	try {
		const trackers = await TrackerService.find({});
		return trackers;
	} catch (error) {
		console.error('Error fetching tracker services:', error);
		return [];
	}
};

module.exports = { getTrackerServices };