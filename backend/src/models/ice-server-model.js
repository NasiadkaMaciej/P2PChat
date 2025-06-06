const mongoose = require('mongoose');

const IceServerSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	type: {
		type: String,
		required: true,
		enum: ['stun', 'turn'],
		lowercase: true
	},
	url: {
		type: String,
		required: true,
		trim: true
	},
	username: {
		type: String,
		required: false,
		trim: true
	},
	credential: {
		type: String,
		required: false,
		trim: true
	},
	isDefault: {
		type: Boolean,
		default: false
	},
	selected: {
		type: Boolean,
		default: false
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('IceServer', IceServerSchema);