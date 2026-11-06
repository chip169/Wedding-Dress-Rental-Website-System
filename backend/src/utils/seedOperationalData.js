import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Order from '../models/Order.model.js';
import Payment from '../models/Payment.model.js';
import Appointment from '../models/Appointment.model.js';
import Dress from '../models/Dress.model.js';
import User from '../models/User.model.js';

async function seedData() {
  try {
    console.log('Connecting to MongoDB...');
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to MongoDB (Atlas)!');
    } catch (e) {
      console.warn('Atlas unreachable. Connecting to local MongoDB...');
      await mongoose.connect('mongodb://127.0.0.1:27017/wedding_dress_rental');
      console.log('Connected to local MongoDB!');
    }

    // Get real dresses from database
    const dresses = await Dress.find().limit(20).lean();
    if (dresses.length === 0) {
      console.log('No dresses found! Please run seed50Dresses.js first.');
      process.exit(1);
    }

    // Get an existing customer or admin
    let customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      customer = await User.findOne();
    }
    const customerId = customer ? customer._id : new mongoose.Types.ObjectId();

    console.log('Cleaning up existing test orders, payments, appointments...');
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await Appointment.deleteMany({});

    const customers = [
      { name: 'Lê Nguyễn Thảo My', phone: '0938128899', email: 'thaomy.le@gmail.com', address: '124 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP. HCM' },
      { name: 'Trần Bích Ngọc', phone: '0903889123', email: 'bichngoc.tran@yahoo.com', address: '45 Lê Duẩn, P. Bến Nghé, Quận 1, TP. HCM' },
      { name: 'Nguyễn Quỳnh Mai', phone: '0912456789', email: 'quynhmai.nguyen@gmail.com', address: '78 Hai Bà Trưng, Phường Tràng Tiền, Quận Hoàn Kiếm, Hà Nội' },
      { name: 'Đỗ Tiến Mạnh', phone: '0987654321', email: 'tienmanh.do@hotmail.com', address: '12 Bạch Đằng, P. Hải Châu 1, Quận Hải Châu, Đà Nẵng' },
      { name: 'Phạm Hương Ly', phone: '0978112233', email: 'huongly.pham@outlook.com', address: '360 Pasteur, Phường Võ Thị Sáu, Quận 3, TP. HCM' },
      { name: 'Vũ Minh Anh', phone: '0945667788', email: 'minhanh.vu@gmail.com', address: '18 Lý Thường Kiệt, Quận Hoàn Kiếm, Hà Nội' },
      { name: 'Hoàng Kim Xuân', phone: '0918223344', email: 'hieuxuan@gmail.com', address: '22 Bis Phan Đăng Lưu, Phường 6, Bình Thạnh, TP. HCM' },
      { name: 'Đặng Thảo Vy', phone: '0933445566', email: 'thaovy.dang@gmail.com', address: '55 Trần Hưng Đạo, Quận Sơn Trà, Đà Nẵng' },
    ];

    const statuses = [
      'deposit_paid',
      'preparing',
      'delivered',
      'renting',
      'returned',
      'completed',
      'completed',
      'deposit_paid',
      'preparing',
      'renting',
      'returned',
      'completed',
      'deposit_paid',
      'completed',
      'preparing',
    ];

    const today = new Date();
    const createdOrders = [];
    const createdPayments = [];

    for (let i = 0; i < statuses.length; i++) {
      const dress = dresses[i % dresses.length];
      const cust = customers[i % customers.length];
      const status = statuses[i];
      const orderCode = `UB-2026-${(i + 1).toString().padStart(4, '0')}`;
      
      // Distribute orders across November 2026
      const dayOfMonth = (i % 20) + 1;
      const createdAt = new Date(2026, 10, dayOfMonth, 10 + (i % 8), 15 * (i % 4));
      
      // Đảm bảo có đơn bàn giao đúng ngày hôm nay
      const rentalStartDate = i === 1 
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30)
        : new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);
      const rentalEndDate = new Date(rentalStartDate.getTime() + 3 * 24 * 60 * 60 * 1000);

      const rentPrice = dress.rentPrice || 5000000;
      const depositAmount = dress.depositAmount || 15000000;
      const totalPayment = rentPrice + depositAmount;

      const orderObj = {
        orderCode,
        customerId: (i % 2 === 0) ? null : customerId,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email,
        shippingAddress: cust.address,
        deliveryMethod: i % 2 === 0 ? 'showroom' : 'express',
        rentalStartDate,
        rentalEndDate,
        rentalDays: 3,
        totalRentPrice: rentPrice,
        totalDeposit: depositAmount,
        totalPayment,
        paymentStatus: status === 'pending_payment' ? 'pending' : 'deposit_paid',
        status,
        contractCode: `HD-SHOWROOM-${(i + 1).toString().padStart(4, '0')}`,
        notes: `Đơn thuê váy cưới mẫu ${dress.name} phục vụ lễ thành hôn.`,
        items: [
          {
            dressId: dress._id,
            name: dress.name,
            size: (dress.sizes && dress.sizes[0]) || 'S',
            rentPrice,
            depositAmount,
            image: (dress.images && dress.images[0]) || `/assets/dresses/dress_${(i + 1).toString().padStart(2, '0')}.jpg`,
          },
        ],
        createdAt,
        updatedAt: createdAt,
      };

      createdOrders.push(orderObj);
    }

    const insertedOrders = await Order.insertMany(createdOrders);
    console.log(`Inserted ${insertedOrders.length} realistic orders.`);

    // Create corresponding payments for successful orders
    for (let i = 0; i < insertedOrders.length; i++) {
      const ord = insertedOrders[i];
      if (['deposit_paid', 'preparing', 'delivered', 'renting', 'returned', 'completed'].includes(ord.status)) {
        createdPayments.push({
          orderId: ord._id,
          customerId: ord.customerId,
          transactionType: 'rental_payment',
          amount: ord.totalRentPrice,
          method: i % 2 === 0 ? 'VIETQR' : 'VNPAY',
          transactionCode: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
          status: 'success',
          paidAt: ord.createdAt,
        });

        createdPayments.push({
          orderId: ord._id,
          customerId: ord.customerId,
          transactionType: 'deposit_payment',
          amount: ord.totalDeposit,
          method: 'VIETQR',
          transactionCode: `DEP-${Math.floor(10000000 + Math.random() * 90000000)}`,
          status: 'success',
          paidAt: ord.createdAt,
        });
      }
    }

    const insertedPayments = await Payment.insertMany(createdPayments);
    console.log(`Inserted ${insertedPayments.length} realistic payments.`);

    // Seed 10 realistic Appointments across branches
    const timeSlots = [
      '09:00 — 10:30',
      '10:30 — 12:00',
      '13:30 — 15:00',
      '15:00 — 16:30',
      '18:30 — 20:00',
    ];
    const branches = ['hcm-q1', 'hn-hoankiem', 'dn-haichau'];
    const aptStatuses = ['pending', 'confirmed', 'confirmed', 'completed', 'pending', 'confirmed', 'completed', 'confirmed', 'pending', 'completed'];

    const appointmentsData = [];
    for (let i = 0; i < 10; i++) {
      const cust = customers[i % customers.length];
      const dress = dresses[i % dresses.length];
      const aptDate = new Date(today.getTime() + (i - 2) * 24 * 60 * 60 * 1000);
      
      appointmentsData.push({
        customerId,
        customerName: cust.name,
        customerPhone: cust.phone,
        customerEmail: cust.email,
        branch: branches[i % branches.length],
        appointmentCode: `APT-2026-${(i + 1).toString().padStart(4, '0')}`,
        appointmentDate: aptDate,
        timeSlot: timeSlots[i % timeSlots.length],
        guestsCount: 2 + (i % 2),
        interestedDresses: [
          {
            id: dress._id,
            name: dress.name,
            code: dress.code,
            image: (dress.images && dress.images[0]) || '',
          },
        ],
        vipServices: ['Tiệc trà chiều Macaron & Trà hoa Paris', 'Tư vấn trực tiếp 1:1 cùng Stylist'],
        status: aptStatuses[i],
        notes: 'Khách hàng mong muốn thử phom dáng siết eo corsetry độc quyền.',
        createdAt: new Date(today.getTime() - (10 - i) * 24 * 60 * 60 * 1000),
      });
    }

    const insertedAppointments = await Appointment.insertMany(appointmentsData);
    console.log(`Inserted ${insertedAppointments.length} realistic appointments.`);

    console.log('Seeding operational data completed successfully!');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding operational data:', err);
    process.exit(1);
  }
}

seedData();
