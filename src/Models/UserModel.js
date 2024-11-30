const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
	{
		pan_no: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},

		mobile_no: {
			type: String,
			required: true,
			match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
		},

		name: {
			type: String,
		},

		role: {
			type: String,
			default: 'USER',
			/*USER, ADMIN */
		},
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model('User', UserSchema);
module.exports = User;
