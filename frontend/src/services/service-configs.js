import {
	addRecord,
	deleteRecord,
	editRecord,
	fetchAll,
	toggleSelection,
} from "./api-service";

// DHT Service Configuration
export const dhtServiceConfig = {
	title: "DHT Services",
	serviceTypeLabel: "DHT Service",
	endpoint: "/api/dht-services",
	initialFormState: {
		name: "",
		url: "",
	},
	formFields: [
		{ name: "name", label: "Name", placeholder: "My DHT Service" },
		{ name: "url", label: "URL", placeholder: "http://dht.example.com:3478" },
	],
	helpContent: (
		<>
			<h4 className="font-medium mb-2">What is a DHT Service?</h4>
			<p className="mb-3">
				A DHT (Distributed Hash Table) service helps peers discover each other
				and exchange connection data automatically without requiring manual
				copying and pasting of connection information.
			</p>

			<h4 className="font-medium mb-2">How It Works</h4>
			<p className="mb-3">
				When you connect to a DHT service, your peer registers with the service
				and gets a unique ID. Other peers can discover your ID through the same
				DHT service, allowing automatic connection negotiation.
			</p>

			<h4 className="font-medium mb-2">Key Features</h4>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
				<div className="bg-gray-900 p-3 rounded-md">
					<h5 className="text-blue-400 mb-1">Benefits</h5>
					<ul className="list-disc pl-5 space-y-1 text-sm">
						<li>
							<strong>Convenience</strong>: One-click connections
						</li>
						<li>
							<strong>Discoverability</strong>: Find peers automatically
						</li>
						<li>
							<strong>Reliability</strong>: Handles NAT traversal details
						</li>
						<li>
							<strong>Simplicity</strong>: No manual data exchange
						</li>
					</ul>
				</div>
				<div className="bg-gray-900 p-3 rounded-md">
					<h5 className="text-purple-400 mb-1">Limitations</h5>
					<ul className="list-disc pl-5 space-y-1 text-sm">
						<li>
							<strong>Privacy</strong>: Server sees connection metadata
						</li>
						<li>
							<strong>Dependency</strong>: Requires server availability
						</li>
						<li>
							<strong>Trust</strong>: Must trust the DHT provider
						</li>
						<li>
							<strong>Scalability</strong>: Limited by server capacity
						</li>
					</ul>
				</div>
			</div>

			<h4 className="font-medium mb-2">Privacy Considerations</h4>
			<p className="mb-3">
				The DHT service can see that peers are connecting and the metadata about
				those connections, but all WebRTC data is still transmitted directly
				between peers. The service provider can potentially log which users are
				connecting to each other and when these connections occur.
			</p>

			<h4 className="font-medium mb-2">Self-Hosting</h4>
			<p className="text-sm">
				For maximum privacy, you can easily host your own DHT service using our
				provided setup script. Self-hosting gives you full control over
				connection metadata while still enjoying automatic peer discovery.
			</p>
		</>
	),
	// Service API methods
	fetchServices: () => fetchAll("/api/dht-services"),
	addService: (data) => addRecord("/api/dht-services", data),
	editService: (id, data) => editRecord("/api/dht-services", id, data),
	deleteService: (id) => deleteRecord("/api/dht-services", id),
};

// ICE Server Configuration
export const iceServerConfig = {
	title: "ICE Servers",
	serviceTypeLabel: "ICE Server",
	endpoint: "/api/ice-servers",
	initialFormState: {
		name: "",
		type: "stun",
		url: "",
		username: "",
		credential: "",
	},
	formFields: [
		{ name: "name", label: "Name", placeholder: "My ICE Server" },
		{
			name: "type",
			label: "Type",
			type: "select",
			options: [
				{ value: "stun", label: "STUN" },
				{ value: "turn", label: "TURN" },
			],
		},
		{
			name: "url",
			label: "URL",
			placeholder: (formData) =>
				formData.type === "stun"
					? "stun:stun.example.com:3478"
					: "turn:turn.example.com:3478",
		},
		{
			name: "username",
			label: "Username",
			placeholder: "username",
			condition: (data) => data.type === "turn",
		},
		{
			name: "credential",
			label: "Credential",
			type: "password",
			placeholder: "password",
			condition: (data) => data.type === "turn",
		},
	],
	helpContent: (
		<>
			<h4 className="font-medium mb-2">What are ICE Servers?</h4>
			<p className="mb-3">
				ICE (Interactive Connectivity Establishment) servers help WebRTC
				connections establish direct peer-to-peer communication across different
				network environments, particularly when peers are behind firewalls,
				NATs, or other network obstacles.
			</p>

			<h4 className="font-medium mb-2">Difference Between STUN and TURN</h4>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
				<div className="bg-gray-900 p-3 rounded-md">
					<h5 className="text-blue-400 mb-1">STUN Servers</h5>
					<ul className="list-disc pl-5 space-y-1 text-sm">
						<li>
							<strong>Purpose</strong>: Discovers your public IP address
						</li>
						<li>
							<strong>Usage</strong>: Lightweight, used first
						</li>
						<li>
							<strong>Success Rate</strong>: Works for ~85% of cases
						</li>
					</ul>
				</div>
				<div className="bg-gray-900 p-3 rounded-md">
					<h5 className="text-purple-400 mb-1">TURN Servers</h5>
					<ul className="list-disc pl-5 space-y-1 text-sm">
						<li>
							<strong>Purpose</strong>: Acts as a relay when direct connections
							fail
						</li>
						<li>
							<strong>Usage</strong>: Fallback when STUN fails
						</li>
						<li>
							<strong>Success Rate</strong>: Resolves ~99% of cases
						</li>
					</ul>
				</div>
			</div>
			<h4 className="font-medium mb-2">Privacy Considerations</h4>
			<p className="text-sm">
				STUN servers reveal your IP address to peers. TURN servers can provide
				IP anonymization, but the TURN provider can see your traffic. Use
				trusted servers for sensitive communications.
			</p>
			<h4 className="font-medium mb-2">Self-Hosting</h4>
			<p className="text-sm">
				You can host your own ICE servers using our setup script for complete
				control over your connection data and enhanced privacy.
			</p>
		</>
	),
	// Service API methods
	fetchServices: () => fetchAll("/api/ice-servers"),
	addService: (data) => {
		const serverData = { ...data };
		// Only include credentials for TURN servers
		if (data.type !== "turn") {
			delete serverData.username;
			delete serverData.credential;
		}
		return addRecord("/api/ice-servers", serverData);
	},
	editService: (id, data) => {
		const serverData = { ...data };
		// Only include credentials for TURN servers
		if (data.type !== "turn") {
			delete serverData.username;
			delete serverData.credential;
		}
		return editRecord("/api/ice-servers", id, serverData);
	},
	deleteService: (id) => deleteRecord("/api/ice-servers", id),
};

// Tracker Service Configuration
export const trackerServiceConfig = {
	title: "WebTorrent Trackers",
	serviceTypeLabel: "Tracker",
	endpoint: "/api/tracker-services",
	initialFormState: {
		name: "",
		url: "",
	},
	formFields: [
		{
			name: "name",
			label: "Name",
			type: "text",
			placeholder: "My Tracker",
			required: true,
		},
		{
			name: "url",
			label: "URL",
			type: "text",
			placeholder: "wss://tracker.example.com",
			required: true,
		},
	],
	helpContent: (
		<>
			<h4 className="font-medium mb-2">What are WebTorrent Trackers?</h4>
			<p className="mb-3">
				WebTorrent trackers help coordinate peer connections for file transfers
				in p2pChat. They only facilitate the initial connection between peers
				and don't see any of your file content.
			</p>

			<h4 className="font-medium mb-2">How Trackers Work</h4>
			<p className="mb-3">
				When sending a file, your client announces to the tracker that it has a
				file to share. The tracker then helps other peers find and connect to
				you to download the file directly through WebRTC.
			</p>

			<h4 className="font-medium mb-2">Privacy Considerations</h4>
			<p className="mb-3">
				Trackers can see metadata about your file transfers (file hashes, sizes,
				and which peers are connecting), but cannot access the actual file
				contents. All data transfers happen directly between peers via encrypted
				WebRTC connections after the initial coordination.
			</p>

			<h4 className="font-medium mb-2">Self-Hosting Options</h4>
			<p className="text-sm">
				For enhanced privacy, you can host your own WebTorrent tracker using our
				setup script. Self-hosting ensures you maintain control over all
				connection metadata.
			</p>
		</>
	),
	// Service API methods
	fetchServices: () => fetchAll("/api/tracker-services"),
	addService: (data) => addRecord("/api/tracker-services", data),
	editService: (id, data) => editRecord("/api/tracker-services", id, data),
	deleteService: (id) => deleteRecord("/api/tracker-services", id),
};
