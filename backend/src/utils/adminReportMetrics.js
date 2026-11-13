export const paymentDate = (payment) => payment.paidAt || payment.createdAt;
export const sumPayments = (payments, types) => payments.reduce((sum, payment) => sum + (types.includes(payment.transactionType) ? Number(payment.amount || 0) : 0), 0);
export const growthRate = (current, previous) => previous > 0 ? Math.round((current - previous) / previous * 1000) / 10 : current === 0 ? 0 : null;
export const depositBalance = (payments) =>
    sumPayments(payments, ['deposit_payment']) - sumPayments(payments, ['deposit_refund']);

export function retainedDepositCharges(payments, inspections) {
    const depositsByOrder = new Map();
    for (const payment of payments) {
        if (!['deposit_payment', 'deposit_refund'].includes(payment.transactionType) || !payment.orderId)
            continue;
        const orderId = String(payment.orderId._id ?? payment.orderId);
        const deposits = depositsByOrder.get(orderId) ?? [];
        deposits.push(payment);
        depositsByOrder.set(orderId, deposits);
    }

    return inspections.flatMap((inspection) => {
        const date = inspection.customerConfirmedAt || inspection.refundedAt;
        const deposits = depositsByOrder.get(String(inspection.orderId));
        if (!date || !deposits)
            return [];

        const balanceAtApproval = depositBalance(deposits.filter((payment) => paymentDate(payment) <= date));
        const retained = Math.max(0, Math.min(inspection.totalDeduction, balanceAtApproval, depositBalance(deposits)));
        if (!retained)
            return [];

        // Apply the late fee first, as it is capped at the deposit before damage is added.
        const latePenaltyRevenue = Math.min(retained, Number(inspection.latePenaltyFee || 0));
        return [{ date, damagePayment: retained - latePenaltyRevenue, latePenaltyRevenue }];
    });
}

export function revenueTotals(payments, charges) {
    const rentalRevenue = sumPayments(payments, ['rental_payment']);
    const damagePayment = sumPayments(payments, ['damage_compensation']) +
        charges.reduce((sum, charge) => sum + charge.damagePayment, 0);
    const latePenaltyRevenue = charges.reduce((sum, charge) => sum + charge.latePenaltyRevenue, 0);
    return { revenue: rentalRevenue + damagePayment + latePenaltyRevenue, rentalRevenue, damagePayment, latePenaltyRevenue };
}

const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export function reportBounds(period, now = new Date()) {
    let start = dayStart(now), end;
    if (period === 'today' || period === 'week') {
        if (period === 'week')
            start.setDate(start.getDate() - 6);
        end = dayStart(now);
        end.setDate(end.getDate() + 1);
    }
    else if (period === 'quarter') {
        start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        end = new Date(start.getFullYear(), start.getMonth() + 3, 1);
    }
    else if (period === 'year') {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
    }
    else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
    return { start, end };
}
export function previousBounds(period, start) {
    const previous = new Date(start);
    if (period === 'week')
        previous.setDate(previous.getDate() - 7);
    else if (period === 'year')
        previous.setFullYear(previous.getFullYear() - 1);
    else
        previous.setMonth(previous.getMonth() - (period === 'quarter' ? 3 : 1));
    return { start: previous, end: start };
}
export const isInPeriod = (date, start, end) => date && new Date(date) >= start && new Date(date) < end;
export function reportBuckets(period, start, end) {
    const result = [];
    const daily = period === 'today' || period === 'week';
    let cursor = new Date(start);
    while (cursor < end) {
        const next = new Date(cursor);
        if (daily)
            next.setDate(next.getDate() + 1);
        else if (period === 'month')
            next.setDate(next.getDate() + 7);
        else
            next.setMonth(next.getMonth() + 1);
        if (next > end)
            next.setTime(end.getTime());
        const last = new Date(next.getTime() - 1);
        const date = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
        const label = daily ? date(cursor) : period === 'month' ? `Tuần ${result.length + 1} (${date(cursor)} – ${date(last)})` : `Tháng ${cursor.getMonth() + 1}`;
        result.push({ start: new Date(cursor), end: next, label, shortLabel: daily || period === 'month' ? date(cursor) : `T${cursor.getMonth() + 1}` });
        cursor = next;
    }
    return result;
}
export function revenueChart(payments, orders, period, start, end, charges) {
    let previous = null;
    return reportBuckets(period, start, end).map((bucket) => {
        const selected = payments.filter((p) => isInPeriod(paymentDate(p), bucket.start, bucket.end));
        const totals = revenueTotals(selected, charges.filter((charge) => isInPeriod(charge.date, bucket.start, bucket.end)));
        const row = { label: bucket.label, shortLabel: bucket.shortLabel, ...totals,
            depositRevenue: sumPayments(selected, ['deposit_payment']),
            transactions: selected.length, orders: orders.filter((o) => isInPeriod(o.createdAt, bucket.start, bucket.end)).length,
            growthRate: previous === null ? null : growthRate(totals.revenue, previous) };
        previous = totals.revenue;
        return row;
    });
}
export function rankedDresses(payments, dresses) {
    const catalog = new Map(dresses.map((dress) => [String(dress._id), dress]));
    const groups = new Map();
    const rentalTotal = sumPayments(payments, ['rental_payment']);
    for (const payment of payments.filter((p) => p.transactionType === 'rental_payment')) {
        const order = payment.orderId;
        const items = order?.items || [];
        const weights = items.map((item) => Math.max(0, Number(item.rentPrice ?? item.price ?? item.rentalPrice ?? 0)));
        const weightTotal = weights.reduce((a, b) => a + b, 0);
        let allocated = 0;
        items.forEach((item, index) => {
            const key = String(item.dressId?._id || item.dressId || item.name);
            const dress = catalog.get(key);
            const revenue = index === items.length - 1 ? Number(payment.amount) - allocated : Math.floor(Number(payment.amount) * (weightTotal ? weights[index] / weightTotal : 1 / items.length));
            allocated += revenue;
            if (!groups.has(key))
                groups.set(key, { name: item.name || dress?.name || 'Lễ phục', code: dress?.code || item.dressCode || '', image: item.image || dress?.images?.[0] || '', totalRevenue: 0, orders: new Set() });
            const group = groups.get(key);
            group.totalRevenue += revenue;
            group.orders.add(String(order._id));
        });
    }
    return [...groups.values()].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5).map(({ orders, ...dress }, index) => ({ ...dress, rank: index + 1, rentalCount: orders.size, share: rentalTotal ? Math.round(dress.totalRevenue / rentalTotal * 100) : 0 }));
}
