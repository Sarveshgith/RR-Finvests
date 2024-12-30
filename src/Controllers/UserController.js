const User = require('../Models/UserModel');
const jwt = require('jsonwebtoken');
const DefinedError = require('../Middleware/DefinedError');
const { errHandle } = require('../Middleware/errHandle');
const secretKey = process.env.SECRET_TOKEN;
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');

const CreateUser = async (req, res) => {
  try {
    const { pan, mobile, name, role, initVal, currVal } = req.body;
    if ([pan, mobile, name, initVal, currVal].some((field) => !field)) {
      throw new DefinedError(400, 'error', 'Missing Fields', 'User Not Created');
    }

    const user_check = await User.findOne({ pan_no: pan });
    if (user_check) {
      throw new DefinedError(409, 'error', 'User Already Exists', 'User Not Created');
    }

    const newUser = new User({
      pan_no: pan,
      mobile_no: mobile,
      name: name,
      initial_deposit: initVal,
      current_value: currVal,
    });

    if (role) {
      newUser.role = role;
    }
    const user = await User.create(newUser);
    return res.status(200).json(user);
  } catch (err) {
    errHandle(err, err instanceof DefinedError, 'User Not Created', res);
  }
};

const LoginUser = async (req, res) => {
  try {
    const { pan, mobile } = req.body;
    if ([pan, mobile].some((field) => !field)) {
      throw new DefinedError(400, 'error', 'Missing Fields', 'User Not Logged In');
    }

    const user_check = await User.findOne({
      pan_no: pan,
      mobile_no: mobile,
    });

    if (!user_check) {
      throw new DefinedError(404, 'error', 'User Not Found', 'User Not Logged In');
    }

    const token = jwt.sign(
      {
        pan: user_check.pan_no,
        mobile: user_check.mobile_no,
        role: user_check.role,
      },
      secretKey,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ token });
  } catch (err) {
    errHandle(err, err instanceof DefinedError, 'User Not Logged In', res);
  }
};

const UpdateUser = async (req, res) => {
  try {
    const { pan, mobile, name, role, currVal } = req.body;
    if (!pan) {
      throw new DefinedError(400, 'error', 'Missing Fields', 'User Not Updated');
    }

    const updates = {};
    if (mobile) {
      if (!/^\d{10}$/.test(mobile)) {
        throw new DefinedError(400, 'error', 'Invalid Mobile Number', 'User Not Updated');
      }
      updates.mobile_no = mobile;
    }
    if (name) {
      updates.name = name;
    }
    if (role) {
      if (!['USER', 'ADMIN'].includes(role)) {
        throw new DefinedError(400, 'error', 'Invalid Role', 'User Not Updated');
      }
      updates.role = role;
    }
    if (currVal) {
      updates.current_value = currVal;
    }

    const user = await User.findOneAndUpdate({ pan_no: pan }, { $set: updates }, { new: true });

    if (!user) {
      throw new DefinedError(404, 'error', 'User Not Found', 'User Not Updated');
    }

    return res.status(200).json(user);
  } catch (err) {
    errHandle(err, err instanceof DefinedError, 'User Not Updated', res);
  }
};

const GetAllUser = async (req, res) => {
  try {
    const user = await User.find();
    return res.status(200).json(user);
  } catch (err) {
    errHandle(err, err instanceof DefinedError, 'User Not Retrieved', res);
  }
};

const RemoveUser = async (req, res) => {
  try {
    const { pan } = req.body;
    if (!pan) {
      throw new DefinedError(400, 'error', 'Missing Fields', 'User Not Removed');
    }

    const result = await User.findOne({ pan_no: pan });
    if (!result) {
      throw new DefinedError(404, 'error', 'User Not Found', 'User Not Removed');
    }

    await User.deleteOne({ pan_no: result.pan_no });
    return res.status(200).json({ message: 'User Removed Successfully' });
  } catch (err) {
    errHandle(err, err instanceof DefinedError, 'User Not Removed', res);
    console.log(err);
  }
};

const UploadUsers = async (req, res) => {
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const usersToCreate = sheetData.map((row) => {
      const trimmedMobileNo = row.mobile_no ? String(row.mobile_no).trim() : '';
      const trimmedPanNo = row.pan_no ? String(row.pan_no).trim() : '';

      const isValidMobile = /^\d{10}$/.test(trimmedMobileNo);
      const isValidPan = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(trimmedPanNo);

      if (!isValidMobile) {
        throw new DefinedError(400, 'error', `Invalid mobile number: ${trimmedMobileNo}`, 'Validation Failed');
      }

      if (!isValidPan) {
        throw new DefinedError(400, 'error', `Invalid Pan number: ${row.pan_no}`, 'Validation Failed');
      }

      const mobileNumberAsNumber = Number(trimmedMobileNo);

      return {
        pan_no: trimmedPanNo,
        mobile_no: mobileNumberAsNumber,
        name: row.name ? String(row.name).trim() : '',
        role: row.role ? String(row.role).trim() : 'USER',
      };
    });

    const result = await User.insertMany(usersToCreate);
    return res.status(200).json({ message: `Inserted ${result.length} users successfully!` });
  } catch (err) {
    errHandle(err, err instanceof DefinedError, 'Bulk Save Failed', res);
    console.log(err);
  }
};

const GetUserByPan = async (req, res) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      throw new DefinedError(401, 'error', 'Token Not Found', 'Unauthorized');
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    const decoded = jwt.verify(token, secretKey);

    const { pan } = decoded;

    const user = await User.findOne({ pan_no: pan });
    if (!user) {
      throw new DefinedError(404, 'error', 'User Not Found', 'User Not Retrieved');
    }
    return res.status(200).json(user);
  } catch (err) {
    errHandle(err, err instanceof DefinedError, 'User Not Retrieved', res);
  }
};

module.exports = {
  CreateUser,
  LoginUser,
  GetAllUser,
  UpdateUser,
  UploadUsers,
  RemoveUser,
  GetUserByPan,
};
