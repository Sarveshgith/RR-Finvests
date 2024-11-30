const express = require('express');
const dbConnect = require('./Config/dbConnect');
const errorHandler = require('./Middleware/ErrorHandler');
const dotenv = require('dotenv').config();
const fast2sms = require('fast-two-sms');
const DefinedError = require('./Middleware/DefinedError');

const port = 5000;
dbConnect();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/users', require('./Routes/UserRoute'));
app.use(errorHandler);

app.set('view engine', 'ejs');
app.get('/', (req, res) => {
	res.render('index.ejs');
});

app.post('/send_msg', async (req, res) => {
	const { number, msg } = req.body;
	console.log(`Sending message to ${number}: ${msg}`);

	const options = {
		authorization: process.env.API_KEY,
		message: msg,
		numbers: [number],
	};

	try {
		const response = await fast2sms.sendMessage(options);
		res.status(200).json({
			success: true,
			message: 'Message sent successfully',
			data: response,
		});
		console.log('Message sent:', response);
	} catch (error) {
		console.error('Error sending message:', error);
		res.status(500).json({
			success: false,
			message: 'Message not sent',
			error: error.message,
		});
	}
});

app.listen(port, () => {
	console.log(`Server is running on ${port}`);
});
