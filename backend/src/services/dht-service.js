const DhtService = require('../models/dht-service-model');

const getDhtServices = async () => {
	try {
		const dbServers = await DhtService.find({});
		return dbServers;
	} catch (error) {
		console.error('Error fetching DHT services:', error);
		return [];
	}
};

module.exports = { getDhtServices };