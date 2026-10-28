import * as orderService from '../services/order.service.js';

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
    const orders = await orderService.getMyOrders(req.user._id);
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

