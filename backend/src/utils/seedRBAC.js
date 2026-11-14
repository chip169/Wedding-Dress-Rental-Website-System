import User from '../models/userModel.js';

/**
 * Hàm tự động khởi tạo các tài khoản người dùng mẫu mặc định vào MongoDB
 */
export const seedRBAC = async () => {
  try {
    let adminUser = await User.findOne({ email: 'admin@unibridal.com' });
    if (!adminUser) {
      adminUser = await User.create({
        fullName: 'UniBridal Administrator',
        email: 'admin@unibridal.com',
        password: 'AdminPassword123@',
        phone: '0908123888',
        role: 'admin',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('Default Admin created: admin@unibridal.com / AdminPassword123@');
    } else {
      adminUser.role = 'admin';
      adminUser.isEmailVerified = true;
      adminUser.isActive = true;
      await adminUser.save();
    }

    let staffUser = await User.findOne({ email: 'staff@unibridal.com' });
    if (!staffUser) {
      staffUser = await User.create({
        fullName: 'Chuyên Viên Atelier UniBridal',
        email: 'staff@unibridal.com',
        password: 'StaffPassword123@',
        phone: '0908123999',
        role: 'staff',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('Default Staff created: staff@unibridal.com / StaffPassword123@');
    } else {
      staffUser.role = 'staff';
      staffUser.isEmailVerified = true;
      staffUser.isActive = true;
      await staffUser.save();
    }

    console.log('Default users synchronized successfully.');
  } catch (error) {
    console.error('Error seeding default users:', error.message);
  }
};

export default seedRBAC;
