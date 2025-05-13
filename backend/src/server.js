const mongoose = require('mongoose');
const app = require('./app');

// Environment variables with defaults
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_URI || 'mongodb://database:27017/chat-app';

// MongoDB Connection
mongoose.connect(mongoURI)
	.then(() => {
		console.log('MongoDB connected');

		// Start server after successful DB connection
		const server = app.listen(PORT, () => {
			console.log(`Backend server running on port ${PORT}`);
		});

		// Graceful shutdown
		process.on('SIGINT', () => {
			console.log('Shutting down backend...');
			server.close(() => {
				mongoose.connection.close(false, () => {
					console.log('MongoDB connection closed.');
					process.exit(0);
				});
			});
		});

		process.on('SIGTERM', () => {
			console.log('SIGTERM received, shutting down...');
			server.close(() => {
				mongoose.connection.close(false, () => {
					console.log('MongoDB connection closed.');
					process.exit(0);
				});
			});
		});
	})
	.catch(err => {
		console.error('MongoDB connection error:', err);
		process.exit(1);
	});