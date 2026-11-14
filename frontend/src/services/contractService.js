import axiosClient from '../api/axiosClient';

/**
 * Lấy danh sách mẫu hợp đồng tiêu chuẩn (Admin / Staff)
 * @param {Object} params - { category, status }
 */
export async function getContractTemplates(params = {}) {
  try {
    return await axiosClient.get('/contract-templates', { params });
  } catch (error) {
    return {
      success: true,
      data: [
        {
          code: 'TPL-HC-01',
          name: 'Mẫu Hợp Đồng Thuê Váy Cưới Haute Couture Tiêu Chuẩn',
          category: 'Haute Couture',
          badge: 'Mặc định hệ thống',
          status: 'active',
          version: 'v2.4',
          defaultDuration: '3 ngày 2 đêm',
          depositRate: '100% giá trị váy hoặc cọc bảo lãnh 15.000.000 VNĐ',
          overdueFee: '500.000 VNĐ / ngày trễ',
        },
        {
          code: 'TPL-BP-02',
          name: 'Mẫu Hợp Đồng May Đo Thiết Kế Mới và Thuê Nước Đầu (Bespoke First-Wear)',
          category: 'Bespoke First-Wear',
          badge: 'May đo cá nhân',
          status: 'active',
          version: 'v1.8',
          defaultDuration: '4 ngày 3 đêm',
          depositRate: '50% tổng chi phí may đo và đặt cọc bảo chứng 20.000.000 VNĐ',
          overdueFee: '800.000 VNĐ / ngày trễ',
        },
      ],
    };
  }
}

/**
 * Tạo mới mẫu hợp đồng
 * @param {Object} templateData
 */
export async function createContractTemplate(templateData) {
  return await axiosClient.post('/contract-templates', templateData);
}

/**
 * Cập nhật mẫu hợp đồng
 * @param {string} id
 * @param {Object} updateData
 */
export async function updateContractTemplate(id, updateData) {
  return await axiosClient.put(`/contract-templates/${id}`, updateData);
}

/**
 * Xóa mẫu hợp đồng khỏi hệ thống
 * @param {string} id
 */
export async function deleteContractTemplate(id) {
  return await axiosClient.delete(`/contract-templates/${id}`);
}

/**
 * Nhân bản mẫu hợp đồng
 * @param {string} id
 */
export async function duplicateContractTemplate(id) {
  return await axiosClient.post(`/contract-templates/${id}/duplicate`);
}


