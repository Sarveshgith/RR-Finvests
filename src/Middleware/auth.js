const jwt = require('jsonwebtoken');
const DefinedError = require('./DefinedError');
const User = require('../Models/UserModel');
const { errHandle } = require('./errHandle');

const validateTokenAndGetUser = async (token) => {
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  const decoded = jwt.verify(token, process.env.SECRET_TOKEN);
  const user = await User.findOne({ mobile_no: decoded.mobile, pan_no: decoded.pan });
  if (!user) {
    throw new DefinedError(404, 'error', 'User Not Found', 'Unauthorized');
  }
  return { user, decoded };
};

const VerifyAdmin = async (req, res, next) => {
  try {
    let token = req.headers.authorization || req.headers.Authorization;

    if (!token) {
      throw new DefinedError(401, 'error', 'Token Not Found', 'Unauthorized');
    }

    const { user } = await validateTokenAndGetUser(token);

    if (user.role !== 'ADMIN') {
      throw new DefinedError(403, 'error', 'Forbidden', 'Unauthorized');
    }

    req.user = user;
    return next();
  } catch (err) {
    return errHandle(err, err instanceof DefinedError, 'User Not Logged In', res);
  }
};

const VerifyUser = async (req, res, next) => {
  try {
    let token = req.headers.authorization || req.headers.Authorization;

    if (!token) {
      throw new DefinedError(401, 'error', 'Token Not Found', 'Unauthorized');
    }

    const { user } = await validateTokenAndGetUser(token);

    req.user = user;
    return next();
  } catch (err) {
    return errHandle(err, err instanceof DefinedError, 'User Not Logged In', res);
  }
};

module.exports = { VerifyAdmin, VerifyUser };
