import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import seedRBAC from './src/utils/seedRBAC.js';
import seedContractTemplates from './src/utils/seedContractTemplate.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Kết nối Cơ sở dữ liệu và Khởi động Server
const startServer = async () => {
  try {
    const conn = await connectDB();
    if (conn) {
      await seedRBAC();
      await seedContractTemplates();
    }
  } catch (error) {
    console.error('Lỗi khởi tạo dữ liệu DB:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
