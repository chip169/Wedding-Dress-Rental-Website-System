import dns from 'dns';
import mongoose from 'mongoose';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
}

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/wedding_dress_rental';

  try {
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`MongoDB Connected (Atlas): ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`Atlas connection failed (${error.message}). Trying local MongoDB fallback...`);
    try {
      const localConn = await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`MongoDB Connected (Local Fallback): ${localConn.connection.host}`);
      return localConn;
    } catch (localErr) {
      console.error(`Error connecting to both Atlas and local MongoDB: ${localErr.message}`);
    }
  }
};

export default connectDB;
