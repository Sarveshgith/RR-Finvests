const User = require('../Models/UserModel');
const jwt = require('jsonwebtoken');
const DefinedError = require('../Middleware/DefinedError');
const { errHandle } = require('../Middleware/errHandle');
const secretKey = process.env.SECRET_TOKEN;
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');

const CreateUser = async (req, res) => {
	try {
		const { pan, mobile, name, role } = req.body;
		if ([pan, mobile, name].some((field) => !field)) {
			throw new DefinedError(
				400,
				'error',
				'Missing Fields',
				'User Not Created'
			);
		}

		const user_check = await User.findOne({ pan_no: pan });
		if (user_check) {
			throw new DefinedError(
				409,
				'error',
				'User Already Exists',
				'User Not Created'
			);
		}

		const newUser = new User({
			pan_no: pan,
			mobile_no: mobile,
			name: name,
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
			throw new DefinedError(
				400,
				'error',
				'Missing Fields',
				'User Not Logged In'
			);
		}

		const user_check = await User.findOne({
			pan_no: pan,
			mobile_no: mobile,
		});

		if (!user_check) {
			throw new DefinedError(
				404,
				'error',
				'User Not Found',
				'User Not Logged In'
			);
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
			throw new DefinedError(
				400,
				'error',
				'Missing Fields',
				'User Not Removed'
			);
		}

		const result = await User.findOne({ pan_no: pan });
		if (!result) {
			throw new DefinedError(
				404,
				'error',
				'User Not Found',
				'User Not Removed'
			);
		}

		await User.deleteOne(result);
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
			const isValidMobile = /^\d{10}$/.test(trimmedMobileNo);

			const isValidPan = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(row.pan_no);

			if (!isValidMobile) {
				throw new DefinedError(
					400,
					'error',
					`Invalid mobile number: ${trimmedMobileNo}`,
					'Validation Failed'
				);
			}

			if (!isValidPan) {
				throw new DefinedError(
					400,
					'error',
					`Invalid Pan number: ${row.pan_no}`,
					'Validation Failed'
				);
			}

			const mobileNumberAsNumber = Number(trimmedMobileNo);

			return {
				pan_no: row.pan_no ? String(row.pan_no).trim() : '',
				mobile_no: mobileNumberAsNumber,
				name: row.name ? String(row.name).trim() : '',
				role: row.role ? String(row.role).trim() : 'USER',
			};
		});

		const result = await User.insertMany(usersToCreate);
		return res
			.status(200)
			.json({ message: `Inserted ${result.length} users successfully!` });
	} catch (err) {
		errHandle(err, err instanceof DefinedError, 'Bulk Save Failed', res);
		console.log(err);
	}
};

module.exports = {
	CreateUser,
	LoginUser,
	GetAllUser,
	UploadUsers,
	RemoveUser,
};
