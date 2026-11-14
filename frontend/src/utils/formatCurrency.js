/**
 * Định dạng tiền tệ VND chuẩn Việt Nam sử dụng dấu chấm (.) phân cách hàng nghìn
 * @param {number|string} amount
 * @returns {string} Ví dụ: "5.200.000 ₫"
 */
export function formatCurrencyVND(amount) {
  if (amount === undefined || amount === null || amount === '') return '0 ₫';
  const num = typeof amount === 'number' ? amount : Number(String(amount).replace(/[^0-9]/g, ''));
  if (isNaN(num)) return '0 ₫';
  const formatted = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} ₫`;
}

/**
 * Định dạng số nguyên có dấu chấm (.) phân cách hàng nghìn (không kèm ký hiệu ₫)
 * @param {number|string} amount
 * @returns {string} Ví dụ: "5.200.000"
 */
export function formatNumberDots(amount) {
  if (amount === undefined || amount === null || amount === '') return '0';
  const num = typeof amount === 'number' ? amount : Number(String(amount).replace(/[^0-9]/g, ''));
  if (isNaN(num)) return '0';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}


