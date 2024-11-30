const jwt = require('jsonwebtoken');
const DefinedError = require('./DefinedError');
const User = require('../Models/UserModel');
const { errHandle } = require('./errHandle');

const VerifyRole = (roles = []) => {
	return async (req, res, next) => {
		try {
			let token = req.headers.authorization || req.user.Authorization;

			if (token && token.startsWith('Bearer ')) {
				token = token.slice(7, token.length);
			}

			if (!token) {
				throw new DefinedError(401, 'error', 'Token Not Found', 'Unauthorized');
			}

			const decoded = jwt.verify(token, process.env.SECRET_TOKEN);
			const { pan, mobile, role } = decoded;

			const user = await User.findOne({
				mobile_no: mobile,
				pan_no: pan,
			});

			if (!user) {
				throw new DefinedError(404, 'error', 'User Not Found', 'Unauthorized');
			}

			if (roles.length && !roles.includes(user.role)) {
				throw new DefinedError(403, 'error', 'Forbidden', 'Unauthorized');
			}

			next();
		} catch (err) {
			errHandle(err, err instanceof DefinedError, 'User Not Logged In', res);
		}
	};
};

const VerifyUser = VerifyRole(['USER']);
const VerifyAdmin = VerifyRole(['ADMIN']);

module.exports = { VerifyAdmin, VerifyUser };
