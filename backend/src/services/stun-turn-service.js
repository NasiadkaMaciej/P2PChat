const IceServer = require('../models/ice-server-model');

const getIceServers = async () => {
	try {
		const dbServers = await IceServer.find({});
		return dbServers;
	} catch (error) {
		console.error('Error fetching ICE servers:', error);
		return [];
	}
};

module.exports = { getIceServers };