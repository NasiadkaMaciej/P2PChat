// Service to provide ICE (STUN/TURN) server configuration
const IceServer = require('../models/ice-server-model');

const getIceServers = async () => {
	try {
		// Get servers from database
		const dbServers = await IceServer.find({});

		if (dbServers.length === 0) return { iceServers: [] };

		// Process and organize servers by type
		const stunServers = [];
		const turnServers = [];

		dbServers.forEach(server => {
			const iceServer = {
				_id: server._id,
				name: server.name || server.url,
				type: server.type,
				urls: server.url,
				isDefault: server.isDefault
			};

			if (server.type === 'turn') {
				iceServer.username = server.username;
				iceServer.credential = server.credential;
				turnServers.push(iceServer);
			} else stunServers.push(iceServer);
		});

		// Return both types, but organized for the client to use appropriately
		return {
			iceServers: [...stunServers, ...turnServers],
			stunCount: stunServers.length,
			turnCount: turnServers.length
		};
	} catch (error) {
		console.error('Error fetching ICE servers:', error);
		return { iceServers: [], stunCount: 0, turnCount: 0 };
	}
};

module.exports = { getIceServers };