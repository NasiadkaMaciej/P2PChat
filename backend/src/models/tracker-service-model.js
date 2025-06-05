const mongoose = require('mongoose');

const TrackerServiceSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true
	},
	url: {
		type: String,
		required: true,
		trim: true
	},
	isDefault: {
		type: Boolean,
		default: false
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('TrackerService', TrackerServiceSchema);