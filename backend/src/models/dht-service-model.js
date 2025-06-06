const mongoose = require('mongoose');

const dhtServiceSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	url: {
		type: String,
		required: true,
		unique: true,
		validate: {
			validator: function (v) {
				try {
					new URL(v);
					return true;
				} catch (e) {
					return false;
				}
			},
			message: props => `${props.value} is not a valid URL!`
		}
	},
	isDefault: {
		type: Boolean,
		default: false
	}
});

module.exports = mongoose.model('DhtService', dhtServiceSchema);