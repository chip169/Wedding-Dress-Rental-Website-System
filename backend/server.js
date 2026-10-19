import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import seedRBAC from './src/utils/seedRBAC.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Kết nối Cơ sở dữ liệu và Khởi động Server
const startServer = async () => {
  await connectDB();
  await seedRBAC();

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
