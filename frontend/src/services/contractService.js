import axiosClient from '../api/axiosClient';

/**
 * Lấy danh sách hợp đồng (Admin/Staff xem tất cả, Customer xem của mình)
 * @param {Object} params - { status, customerId, page, limit }
 */
export async function getContracts(params = {}) {
  try {
    return await axiosClient.get('/contracts', { params });
  } catch (error) {
    const cached = localStorage.getItem('unibridal-contracts');
    return {
      success: true,
      data: cached ? JSON.parse(cached) : [],
    };
  }
}

/**
 * Lấy chi tiết hợp đồng theo ID hoặc Mã hợp đồng
 * @param {string} idOrCode
 */
export async function getContractById(idOrCode) {
  try {
    return await axiosClient.get(`/contracts/${idOrCode}`);
  } catch (error) {
    const cached = JSON.parse(localStorage.getItem('unibridal-contracts') || '[]');
    const found = cached.find((c) => c._id === idOrCode || c.contractCode === idOrCode);
    return {
      success: !!found,
      data: found || null,
    };
  }
}

/**
 * Tạo mới hợp đồng điện tử từ đơn thuê
 * @param {Object} contractData - { orderId, templateId, customerName, phone, idCard, dressInfo, rentalPeriod, pricing }
 */
export async function createContract(contractData) {
  try {
    return await axiosClient.post('/contracts', contractData);
  } catch (error) {
    const newContract = {
      _id: `ctr_${Date.now()}`,
      contractCode: `HD-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      status: 'pending_signature',
      createdAt: new Date().toISOString(),
      ...contractData,
    };
    const cached = JSON.parse(localStorage.getItem('unibridal-contracts') || '[]');
    cached.unshift(newContract);
    localStorage.setItem('unibridal-contracts', JSON.stringify(cached));
    return {
      success: true,
      message: 'Khởi tạo hợp đồng thành công (Offline Demo)',
      data: newContract,
    };
  }
}

/**
 * Ký số / Xác thực hợp đồng điện tử
 * @param {string} contractId
 * @param {Object} signData - { idCard, signatureMethod, signatureImg }
 */
export async function signContract(contractId, signData) {
  try {
    return await axiosClient.post(`/contracts/${contractId}/sign`, signData);
  } catch (error) {
    const cached = JSON.parse(localStorage.getItem('unibridal-contracts') || '[]');
    const idx = cached.findIndex((c) => c._id === contractId || c.contractCode === contractId);
    if (idx !== -1) {
      cached[idx].status = 'signed';
      cached[idx].signedAt = new Date().toISOString();
      cached[idx].idCard = signData.idCard || cached[idx].idCard;
      localStorage.setItem('unibridal-contracts', JSON.stringify(cached));
      return { success: true, message: 'Ký hợp đồng thành công', data: cached[idx] };
    }
    return { success: true, message: 'Ký hợp đồng thành công (Offline Demo)' };
  }
}

/**
 * Lấy danh sách mẫu hợp đồng tiêu chuẩn
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
          name: 'Mẫu Hợp Đồng May Đo Thiết Kế Mới & Thuê Nước Đầu (Bespoke First-Wear)',
          category: 'Bespoke First-Wear',
          badge: 'May đo cá nhân',
          status: 'active',
          version: 'v1.8',
          defaultDuration: '4 ngày 3 đêm',
          depositRate: '50% tổng chi phí may đo & đặt cọc bảo chứng 20.000.000 VNĐ',
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

