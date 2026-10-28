/**
 * Định dạng tiền tệ VND chuẩn Việt Nam
 * @param {number|string} amount
 * @returns {string} Ví dụ: 5.200.000₫
 */
export function formatCurrencyVND(amount) {
  if (typeof amount !== 'number') {
    const num = Number(amount);
    if (isNaN(num)) return amount || '0₫';
    return new Intl.NumberFormat('vi-VN').format(num) + '₫';
  }
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

/**
 * Chuyển đổi chuỗi tiền tệ ngược lại thành số
 * @param {string} str Ví dụ: "5.200.000₫" -> 5200000
 * @returns {number}
 */
export function parseCurrencyVND(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const cleaned = String(str).replace(/[^0-9]/g, '');
  return Number(cleaned) || 0;
}

