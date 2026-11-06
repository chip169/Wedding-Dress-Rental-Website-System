export function roundedChartScale(maxValue, minimumStep = 5) {
    const value = Math.max(minimumStep * 2, Number(maxValue) || 0);
    const step = Math.ceil(value / 5 / minimumStep) * minimumStep;
    const intervals = Math.ceil(value / step);
    return { max: intervals * step, ticks: Array.from({ length: intervals + 1 }, (_, index) => index * step) };
}
export function formatGrowth(value) {
    if (value == null || !Number.isFinite(Number(value)))
        return 'Chưa có kỳ so sánh';
    return `${Number(value) > 0 ? '+' : ''}${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(Number(value))}%`;
}
export function growthLabel(value) {
    return value == null ? 'Chưa đủ dữ liệu' : value > 0 ? 'Tăng' : value < 0 ? 'Giảm' : 'Không đổi';
}
