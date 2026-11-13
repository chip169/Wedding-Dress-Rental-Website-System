/**
 * Định dạng ngày tháng tiếng Việt đầy đủ (Ví dụ: "Thứ Bảy, ngày 28/10/2026")
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatVietnameseDate(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim();

  // Nếu là định dạng YYYY-MM-DD hoặc ISO string (ví dụ: 2026-11-20T00:00:00.000Z)
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
    const parts = str.split('T')[0].split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m - 1, d);
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    return `${dayName}, ngày ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);

  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[date.getDay()];
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();

  return `${dayName}, ngày ${d}/${m}/${y}`;
}

/**
 * Định dạng ngày ngắn gọn (Ví dụ: "28/10/2026")
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  // Nếu đã ở định dạng DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    return str;
  }
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const cleanIso = str.split('T')[0];
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanIso)) {
    const parts = cleanIso.split('-');
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return str;
}

