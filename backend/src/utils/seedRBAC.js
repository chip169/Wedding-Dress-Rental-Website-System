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
        branch: 'all',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('Default Admin created: admin@unibridal.com / AdminPassword123@');
    } else {
      adminUser.role = 'admin';
      adminUser.branch = 'all';
      adminUser.isEmailVerified = true;
      adminUser.isActive = true;
      await adminUser.save();
    }

    let staffUser = await User.findOne({ email: 'staff@unibridal.com' });
    if (!staffUser) {
      staffUser = await User.create({
        fullName: 'Chuyên Viên Showroom TP.HCM',
        email: 'staff@unibridal.com',
        password: 'StaffPassword123@',
        phone: '0908123999',
        role: 'staff',
        branch: 'hcm-q1',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('Default Staff HCM created: staff@unibridal.com / StaffPassword123@');
    } else {
      staffUser.fullName = 'Chuyên Viên Showroom TP.HCM';
      staffUser.role = 'staff';
      staffUser.branch = 'hcm-q1';
      staffUser.isEmailVerified = true;
      staffUser.isActive = true;
      await staffUser.save();
    }

    let staffHnUser = await User.findOne({ email: 'staff.hn@unibridal.com' });
    if (!staffHnUser) {
      staffHnUser = await User.create({
        fullName: 'Chuyên Viên Showroom Hà Nội',
        email: 'staff.hn@unibridal.com',
        password: 'StaffPassword123@',
        phone: '0912334455',
        role: 'staff',
        branch: 'hn-hoankiem',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('Default Staff HN created: staff.hn@unibridal.com / StaffPassword123@');
    } else {
      staffHnUser.fullName = 'Chuyên Viên Showroom Hà Nội';
      staffHnUser.role = 'staff';
      staffHnUser.branch = 'hn-hoankiem';
      staffHnUser.isEmailVerified = true;
      staffHnUser.isActive = true;
      await staffHnUser.save();
    }

    console.log('Default users synchronized successfully.');
  } catch (error) {
    console.error('Error seeding default users:', error.message);
  }
};

export default seedRBAC;
