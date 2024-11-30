const mongoose = require('mongoose');

const dbConnect = async () => {
	try {
		const connect = await mongoose.connect(process.env.CONNECT_STRING);

		console.log(`Database Connected: 
    Host: ${connect.connection.host} 
    Database: ${connect.connection.name}`);
	} catch (err) {
		console.error(`Error connecting to the database: ${err.message}`);
		process.exit(1);
	}
};

module.exports = dbConnect;
