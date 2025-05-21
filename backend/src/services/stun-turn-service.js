// Service to provide ICE (STUN/TURN) server configuration
const IceServer = require('../models/ice-server-model');

const getIceServers = async () => {
	try {
		// Get only selected servers from database
		const dbServers = await IceServer.find({});

		if (dbServers.length === 0) return { iceServers: [] };

		const iceServers = dbServers.map(server => {
			return {
				_id: server._id,
				name: server.name || server.url,
				type: server.type,
				urls: server.url,
				username: server.type === 'turn' ? server.username : undefined,
				credential: server.type === 'turn' ? server.credential : undefined,
				isDefault: server.isDefault
			};
		});

		return { iceServers };
	} catch (error) {
		console.error('Error fetching ICE servers:', error);
		return { iceServers: [] };
	}
};

module.exports = { getIceServers };