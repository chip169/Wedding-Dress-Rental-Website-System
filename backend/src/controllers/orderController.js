import * as orderService from '../services/orderService.js';
import * as customer from '../services/customerAccountService.js';

export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Tạo đơn thuê váy và ký hợp đồng thành công!',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để xem lịch sử đơn hàng.',
        data: [],
      });
    }
    const orders = await customer.listOrders(req.user._id);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn thuê cá nhân thành công',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAllOrders(req.query);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn thuê hệ thống thành công',
      data: result.orders,
      stats: result.stats,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    await customer.assertOrderAccess(req.user, req.params.id);
    const order = await orderService.getOrderByIdOrCode(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn thuê thành công',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn thuê sang "${status}" thành công!`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getDressBookedDates = async (req, res, next) => {
  try {
    const dressId = req.params.id || req.query.dressId;
    const bookedDates = await orderService.getDressBookedDates(dressId);
    res.status(200).json({
      success: true,
      message: 'Lấy lịch đặt thuê của váy thành công',
      data: bookedDates,
    });
  } catch (error) {
    next(error);
  }
};

export const submitReturnInspection = async (req, res, next) => {
  try {
    const result = await orderService.submitReturnInspection(req.params.id, req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Lập biên bản kiểm định tình trạng váy thành công!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getReturnInspection = async (req, res, next) => {
  try {
    await customer.assertOrderAccess(req.user, req.params.id);
    const inspection = await orderService.getReturnInspection(req.params.id);
    res.status(200).json({
      success: true,
      message: inspection ? 'Lấy biên bản kiểm định thành công' : 'Đơn này chưa có biên bản kiểm định',
      data: inspection,
    });
  } catch (error) {
    next(error);
  }
};

export const approveReturnInspection = async (req, res, next) => {
  try {
    const result = await customer.confirmInspection(req.user, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Đã xác nhận biên bản kiểm định. Đơn hàng đã hoàn tất thành công.',
      data: result,
      order: result.order,
      inspection: result.inspection,
    });
  } catch (error) {
    next(error);
  }
};

export const disputeReturnInspection = async (req, res, next) => {
  try {
    const result = await customer.disputeInspection(req.user, req.params.id, req.body.reason);
    res.status(200).json({
      success: true,
      message: 'Gửi khiếu nại biên bản kiểm định thành công! Chuyên viên showroom sẽ liên hệ giải quyết.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const settleInspectionAdmin = async (req, res, next) => {
  try {
    const result = await orderService.settleInspectionAdmin(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Admin đã xác nhận đàm phán mức phạt và hoàn tiền thành công! Đơn hàng đã chuyển sang Hoàn tất.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

