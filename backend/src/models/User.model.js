import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Họ và tên không được để trống'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email không được để trống'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không đúng định dạng'],
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu không được để trống'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false, // Mặc định không trả về password khi query
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại không được để trống'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Người dùng phải được gán vai trò'],
      index: true,
    },
    customPermissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    // Số đo khách hàng phục vụ tư vấn & chọn size váy cưới
    measurements: {
      height: { type: Number, default: null }, // cm
      weight: { type: Number, default: null }, // kg
      bust: { type: Number, default: null },   // Vòng 1 (cm)
      waist: { type: Number, default: null },  // Vòng 2 (cm)
      hips: { type: Number, default: null },   // Vòng 3 (cm)
    },
    address: {
      street: { type: String, default: '' },
      ward: { type: String, default: '' },
      district: { type: String, default: '' },
      city: { type: String, default: '' },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash mật khẩu trước khi lưu nếu mật khẩu có thay đổi
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh mật khẩu khi đăng nhập
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
