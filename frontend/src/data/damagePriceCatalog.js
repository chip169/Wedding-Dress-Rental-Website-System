/**
 * BẢNG GIÁ ĐỀN BÙ THIỆT HẠI NIÊM YẾT (ATELIER HAUTE COUTURE)
 * Quy định chuẩn hóa chi phí khắc phục tổn thất - 1 Mức giá cố định cho từng lỗi
 * Áp dụng thống nhất đối chiếu trực tiếp với Phụ lục Hợp đồng thuê váy điện tử
 */

export const DAMAGE_PRICE_CATALOG = [
  {
    id: 'normal_wear',
    code: '1',
    name: '1. Hao mòn tự nhiên',
    shortName: 'Hao mòn tự nhiên',
    description: 'Bụi bẩn gấu váy đi lại, mồ hôi, nhăn vải',
    feeType: 'fixed',
    fixedFee: 0,
    feeLabel: '0 VNĐ (Miễn phí trong gói giặt)',
    authority: 'staff',
    authorityLabel: 'Staff chốt ngay',
    isAdminOnly: false,
    color: '#1E8347',
  },
  {
    id: 'minor_stain',
    code: '2',
    name: '2. Vết bẩn nhẹ',
    shortName: 'Vết bẩn nhẹ',
    description: 'Dính son môi, phấn trang điểm, nước ngọt',
    feeType: 'fixed',
    fixedFee: 250000,
    feeLabel: '250.000 VNĐ',
    authority: 'staff',
    authorityLabel: 'Staff chốt ngay',
    isAdminOnly: false,
    color: '#D97706',
  },
  {
    id: 'loose_thread_button',
    code: '3',
    name: '3. Sút chỉ / Tuột cúc',
    shortName: 'Sút chỉ / Tuột cúc',
    description: 'Đứt chỉ viền, bung 1 vài hạt cườm, tuột móc cài',
    feeType: 'fixed',
    fixedFee: 200000,
    feeLabel: '200.000 VNĐ',
    authority: 'staff',
    authorityLabel: 'Staff chốt ngay',
    isAdminOnly: false,
    color: '#D97706',
  },
  {
    id: 'stubborn_stain',
    code: '4',
    name: '4. Vết bẩn cứng đầu',
    shortName: 'Vết bẩn cứng đầu',
    description: 'Dính rượu vang đỏ, dầu mỡ sậm màu, vết bùn đất sâu',
    feeType: 'fixed',
    fixedFee: 500000,
    feeLabel: '500.000 VNĐ',
    authority: 'staff',
    authorityLabel: 'Staff chốt ngay',
    isAdminOnly: false,
    color: '#EA580C',
  },
  {
    id: 'minor_lace_tear',
    code: '5',
    name: '5. Rách gấu ren nhỏ',
    shortName: 'Rách gấu ren nhỏ',
    description: 'Rách ren gấu váy < 5 cm do giẫm gót giày',
    feeType: 'fixed',
    fixedFee: 500000,
    feeLabel: '500.000 VNĐ',
    authority: 'staff',
    authorityLabel: 'Staff chốt ngay',
    isAdminOnly: false,
    color: '#EA580C',
  },
  {
    id: 'broken_zipper',
    code: '6',
    name: '6. Hỏng khóa lưng',
    shortName: 'Hỏng khóa lưng',
    description: 'Kẹt, gãy hoặc rách dây kéo khóa lưng (zipper)',
    feeType: 'fixed',
    fixedFee: 300000,
    feeLabel: '300.000 VNĐ',
    authority: 'staff',
    authorityLabel: 'Staff chốt ngay',
    isAdminOnly: false,
    color: '#D97706',
  },
  {
    id: 'major_tear',
    code: '7',
    name: '7. Rách tùng voan lớn',
    shortName: 'Rách tùng voan lớn',
    description: 'Rách toạc tùng váy > 10 cm, rách lớp vải chính',
    feeType: 'fixed',
    fixedFee: 1500000,
    feeLabel: '1.500.000 VNĐ',
    authority: 'admin',
    authorityLabel: 'Admin phê duyệt',
    isAdminOnly: true,
    color: '#DC2626',
  },
  {
    id: 'lost_accessories',
    code: '8',
    name: '8. Mất phụ kiện',
    shortName: 'Mất phụ kiện',
    description: 'Mất lúp đội đầu, tùng phồng, găng tay, vương miện',
    feeType: 'fixed',
    fixedFee: 500000,
    feeLabel: '500.000 VNĐ (Theo phụ kiện)',
    authority: 'both',
    authorityLabel: 'Staff / Admin duyệt',
    isAdminOnly: false,
    color: '#DC2626',
  },
  {
    id: 'total_damage',
    code: '9',
    name: '9. HỎNG HOÀN TOÀN (Không thể may lại)',
    shortName: 'HỎNG HOÀN TOÀN',
    description: 'Cháy vải do tàn thuốc/nến, rách nát toàn bộ, hỏng gọng',
    feeType: 'deposit_100',
    fixedFee: 0,
    feeLabel: 'TỊCH THU 100% TIỀN CỌC (Số tiền hoàn lại: 0 VNĐ)',
    authority: 'admin_only',
    authorityLabel: 'CHỈ DUY NHẤT ADMIN DUYỆT (Loại bỏ váy vĩnh viễn)',
    isAdminOnly: true,
    color: '#991B1B',
  },
];

export function getDamageCatalogItem(conditionId) {
  if (!conditionId) return DAMAGE_PRICE_CATALOG[0];
  // Backward compatibility mapping
  if (conditionId === 'good') return DAMAGE_PRICE_CATALOG[0]; // normal_wear
  if (conditionId === 'torn_lace') return DAMAGE_PRICE_CATALOG[4]; // minor_lace_tear
  if (conditionId === 'heavy_damage') return DAMAGE_PRICE_CATALOG[6]; // major_tear

  const found = DAMAGE_PRICE_CATALOG.find((item) => item.id === conditionId);
  return found || DAMAGE_PRICE_CATALOG[0];
}

export function computeCompensation(conditionId, _optionValue, maxDeposit = 0) {
  const item = getDamageCatalogItem(conditionId);
  if (!item) return 0;
  if (item.feeType === 'fixed') {
    return Math.min(item.fixedFee, maxDeposit > 0 ? maxDeposit : item.fixedFee);
  }
  if (item.feeType === 'deposit_100') {
    return Math.max(0, maxDeposit);
  }
  return 0;
}
