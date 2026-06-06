const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,  // Fail fast if MongoDB is unreachable
      socketTimeoutMS: 45000,          // Close sockets after 45s of inactivity
    });

    console.log(`✅ [DB] MongoDB connected: ${conn.connection.host}`);
    console.log(`   [DB] Database Name: ${conn.connection.name}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  [DB] MongoDB connection lost. Attempting reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 [DB] MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ [DB] MongoDB runtime error: ${err.message}`);
    });

  } catch (error) {
    console.error(`❌ [DB] Initial connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
