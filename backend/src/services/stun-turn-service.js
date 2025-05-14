// Service to provide ICE (STUN/TURN) server configuration
const IceServer = require('../models/ice-server-model');

const getIceServers = async () => {
	try {
		// Get only selected servers from database
		const dbServers = await IceServer.find({ selected: true });

		// If no servers are selected, find defaults or any server of each type
		if (dbServers.length === 0) {
			// Try to find default servers first
			const defaultServers = await IceServer.find({ isDefault: true });
			if (defaultServers.length > 0) {
				dbServers.push(...defaultServers);
			} else {
				// If no defaults, select one of each type
				const stunServer = await IceServer.findOne({ type: 'stun' });
				const turnServer = await IceServer.findOne({ type: 'turn' });

				if (stunServer) dbServers.push(stunServer);
				if (turnServer) dbServers.push(turnServer);
			}
		}

		// Transform to the expected format for WebRTC
		const iceServers = dbServers.map(server => {
			const iceServer = {
				urls: server.url,
				credentialType: 'password'
			};

			if (server.type === 'turn') {
				iceServer.username = server.username;
				iceServer.credential = server.credential;
			}

			return iceServer;
		});

		return { iceServers };
	} catch (error) {
		console.error('Error fetching ICE servers:', error);
		// Return empty array as fallback
		return { iceServers: [] };
	}
};

module.exports = { getIceServers };