import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Cho phép khách chưa tạo tài khoản cũng có thể gửi yêu cầu
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Tên khách hàng không được để trống'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Số điện thoại không được để trống'],
      trim: true,
    },
    customerEmail: {
      type: String,
      default: '',
      trim: true,
    },
    branch: {
      type: String,
      default: 'hcm-q1',
      trim: true,
    },
    appointmentCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Ngày hẹn thử váy không được để trống'],
      index: true,
    },
    weddingDate: {
      type: Date,
      default: null,
    },
    timeSlot: {
      type: String,
      required: [true, 'Khung giờ thử váy không được để trống'],
      trim: true,
    },
    guestsCount: {
      type: Number,
      default: 2,
    },
    interestedDresses: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    vipServices: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Nhân viên tư vấn phụ trách phòng thử VIP
    },
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
