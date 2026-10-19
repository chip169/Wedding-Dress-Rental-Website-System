import Permission from '../models/Permission.model.js';
import Role from '../models/Role.model.js';
import User from '../models/User.model.js';

// Danh sách các quyền hệ thống theo 8 Epics trong Product Backlog
const SYSTEM_PERMISSIONS = [
  // 1. Module Sản phẩm & Danh mục (DRESS)
  { code: 'DRESS_VIEW', name: 'Xem danh mục và mẫu váy cưới', module: 'DRESS', description: 'Cho phép xem thông tin sản phẩm và bộ sưu tập' },
  { code: 'DRESS_MANAGE', name: 'Quản lý mẫu váy cưới', module: 'DRESS', description: 'Thêm, sửa, xóa/ẩn sản phẩm và chỉnh giá thuê, tiền cọc' },

  // 2. Module Lịch hẹn thử đồ (APPOINTMENT)
  { code: 'APPOINTMENT_CREATE', name: 'Đặt lịch hẹn thử váy', module: 'APPOINTMENT', description: 'Gửi yêu cầu đặt lịch phòng thử đồ VIP' },
  { code: 'APPOINTMENT_VIEW_OWN', name: 'Xem lịch hẹn cá nhân', module: 'APPOINTMENT', description: 'Khách hàng xem các lịch hẹn của mình' },
  { code: 'APPOINTMENT_MANAGE', name: 'Quản lý lịch hẹn showroom', module: 'APPOINTMENT', description: 'Nhân viên tiếp nhận, đổi trạng thái và hủy lịch hẹn' },

  // 3. Module Đơn thuê trang phục (ORDER)
  { code: 'ORDER_CREATE', name: 'Tạo đơn đặt thuê váy', module: 'ORDER', description: 'Chọn ngày thuê, thanh toán cọc và tạo hợp đồng' },
  { code: 'ORDER_VIEW_OWN', name: 'Xem đơn thuê cá nhân', module: 'ORDER', description: 'Xem tiến độ và hóa đơn các đơn hàng của mình' },
  { code: 'ORDER_VIEW_ALL', name: 'Xem toàn bộ đơn thuê', module: 'ORDER', description: 'Nhân viên xem danh sách đơn thuê của tất cả khách hàng' },
  { code: 'ORDER_HANDOVER', name: 'Bàn giao đồ cho khách', module: 'ORDER', description: 'Chuyển trạng thái đơn sang Đang thuê / Bàn giao' },
  { code: 'ORDER_INSPECT_RETURN', name: 'Kiểm tra trả đồ và quyết toán', module: 'ORDER', description: 'Kiểm tra độ hư hỏng, vết bẩn và tính toán tiền cọc' },

  // 4. Module Thanh toán & Cọc (PAYMENT)
  { code: 'PAYMENT_DEPOSIT', name: 'Thanh toán tiền cọc trực tuyến', module: 'PAYMENT', description: 'Thanh toán qua cổng VNPAY / VietQR' },
  { code: 'PAYMENT_CASH_CONFIRM', name: 'Xác nhận thanh toán tiền mặt', module: 'PAYMENT', description: 'Nhân viên xác nhận đã thu cọc hoặc tiền thuê tại quầy' },
  { code: 'DEPOSIT_REFUND', name: 'Hoàn trả tiền cọc cho khách', module: 'PAYMENT', description: 'Xác nhận lệnh hoàn tiền cọc sau khi kiểm tra váy nguyên vẹn' },

  // 5. Module Đánh giá (REVIEW)
  { code: 'REVIEW_CREATE', name: 'Đánh giá mẫu váy sau khi thuê', module: 'REVIEW', description: 'Gửi đánh giá sao và bình luận kèm ảnh' },
  { code: 'REVIEW_MODERATE', name: 'Kiểm duyệt đánh giá', module: 'REVIEW', description: 'Quản trị viên ẩn hoặc duyệt phản hồi từ người dùng' },

  // 6. Module Báo cáo & Người dùng (SYSTEM)
  { code: 'USER_MANAGE', name: 'Quản lý người dùng', module: 'SYSTEM', description: 'Tạo tài khoản nhân viên, đổi vai trò, khóa tài khoản' },
  { code: 'ROLE_MANAGE', name: 'Quản lý vai trò và phân quyền', module: 'SYSTEM', description: 'Tạo vai trò mới và cấu hình ma trận quyền' },
  { code: 'REPORT_VIEW', name: 'Xem báo cáo doanh thu & thống kê', module: 'REPORT', description: 'Xem biểu đồ doanh thu thuê đồ và tỷ lệ váy' },
];

/**
 * Hàm tự động khởi tạo Permissions & Roles mặc định vào MongoDB
 */
export const seedRBAC = async () => {
  try {
    // 1. Khởi tạo / Đồng bộ Permissions
    const permissionDocs = [];
    for (const perm of SYSTEM_PERMISSIONS) {
      const doc = await Permission.findOneAndUpdate(
        { code: perm.code },
        { $set: perm },
        { upsert: true, returnDocument: 'after' }
      );
      permissionDocs.push(doc);
    }

    const permissionMap = {};
    permissionDocs.forEach((p) => {
      permissionMap[p.code] = p._id;
    });

    // 2. Cấu hình vai trò ADMIN (Toàn quyền)
    const allPermissionIds = permissionDocs.map((p) => p._id);
    await Role.findOneAndUpdate(
      { code: 'ADMIN' },
      {
        $set: {
          name: 'Quản trị viên',
          code: 'ADMIN',
          description: 'Toàn quyền quản trị hệ thống, kho hàng, nhân sự và tài chính',
          permissions: allPermissionIds,
          isDefault: false,
          isSystem: true,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 3. Cấu hình vai trò STAFF (Nhân viên Showroom)
    const staffPermissionCodes = [
      'DRESS_VIEW',
      'APPOINTMENT_MANAGE',
      'ORDER_VIEW_ALL',
      'ORDER_HANDOVER',
      'ORDER_INSPECT_RETURN',
      'PAYMENT_CASH_CONFIRM',
      'DEPOSIT_REFUND',
    ];
    const staffPermissionIds = staffPermissionCodes
      .map((code) => permissionMap[code])
      .filter(Boolean);

    await Role.findOneAndUpdate(
      { code: 'STAFF' },
      {
        $set: {
          name: 'Nhân viên Showroom',
          code: 'STAFF',
          description: 'Tiếp nhận lịch thử váy, bàn giao đồ, kiểm tra tình trạng khi trả và xử lý cọc',
          permissions: staffPermissionIds,
          isDefault: false,
          isSystem: true,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 4. Cấu hình vai trò CUSTOMER (Khách hàng)
    const customerPermissionCodes = [
      'DRESS_VIEW',
      'APPOINTMENT_CREATE',
      'APPOINTMENT_VIEW_OWN',
      'ORDER_CREATE',
      'ORDER_VIEW_OWN',
      'PAYMENT_DEPOSIT',
      'REVIEW_CREATE',
    ];
    const customerPermissionIds = customerPermissionCodes
      .map((code) => permissionMap[code])
      .filter(Boolean);

    const customerRole = await Role.findOneAndUpdate(
      { code: 'CUSTOMER' },
      {
        $set: {
          name: 'Khách hàng',
          code: 'CUSTOMER',
          description: 'Khách hàng thành viên có quyền thuê đồ, đặt lịch thử và đánh giá',
          permissions: customerPermissionIds,
          isDefault: true,
          isSystem: true,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 5. Tạo tài khoản Admin mặc định nếu chưa có tài khoản nào
    const adminRole = await Role.findOne({ code: 'ADMIN' });
    const adminExists = await User.findOne({ email: 'admin@unibridal.com' });
    if (!adminExists && adminRole) {
      await User.create({
        fullName: 'UniBridal Administrator',
        email: 'admin@unibridal.com',
        password: 'AdminPassword123@',
        phone: '0908123888',
        roleId: adminRole._id,
      });
      console.log('Default Admin created: admin@unibridal.com / AdminPassword123@');
    }

    console.log('RBAC Permissions & Roles synchronized successfully.');
  } catch (error) {
    console.error('Error seeding RBAC:', error.message);
  }
};

export default seedRBAC;
