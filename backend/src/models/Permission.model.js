import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên quyền không được để trống'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Mã quyền không được để trống'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    module: {
      type: String,
      required: [true, 'Module quyền không được để trống'],
      enum: ['AUTH', 'DRESS', 'APPOINTMENT', 'ORDER', 'PAYMENT', 'REPORT', 'SYSTEM'],
      uppercase: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Permission = mongoose.model('Permission', permissionSchema);
export default Permission;
