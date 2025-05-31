// database connection
const mongoose = require('mongoose');

// Configure mongoose options
mongoose.set('strictQuery', true);

// Connect to MongoDB with error handling
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_CONNECTION);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn.connection;
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        // Retry connection after 5 seconds
        setTimeout(connectDB, 5000);
    }
};

// Initialize connection
const db = connectDB();

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
});

module.exports = db;