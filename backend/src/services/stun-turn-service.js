/**
 * Service to provide ICE (STUN/TURN) server configuration
 */

const getIceServers = () => {
	// Read from environment variables
	const stunServers = process.env.STUN_SERVERS?.split(',') || [];
	const turnServerUrl = process.env.TURN_SERVER_URL;
	const turnServerUsername = process.env.TURN_SERVER_USERNAME;
	const turnServerCredential = process.env.TURN_SERVER_CREDENTIAL;

	const iceServers = [];

	// Add STUN servers
	if (stunServers.length > 0) {
		iceServers.push({
			urls: stunServers,
			credentialType: 'password'
		});
	}

	// Add TURN server if all required params exist
	if (turnServerUrl && turnServerUsername && turnServerCredential) {
		iceServers.push({
			urls: turnServerUrl,
			username: turnServerUsername,
			credential: turnServerCredential,
			credentialType: 'password'
		});
	}

	return { iceServers };
};

module.exports = { getIceServers };