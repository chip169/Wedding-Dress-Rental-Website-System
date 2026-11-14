import { getAllDresses } from '../services/dressService';
import { getAllOrdersAdmin } from '../services/orderService';

const STORAGE_KEY = 'unibridal_completed_maintenance';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Ghi nhận đơn thuê khi hoàn tất -> sản phẩm đúng size theo đơn thuê
 * sẽ tự động chuyển sang trạng thái bảo dưỡng trong 1 ngày (24 giờ).
 */
export const recordCompletedOrderMaintenance = (order) => {
  if (!order) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const records = raw ? JSON.parse(raw) : {};
    const orderId = String(order._id || order.id || order.orderCode || Date.now());

    const items = (order.items && order.items.length > 0
      ? order.items
      : [
          {
            dressId: order.dressId?._id || order.dressId || order.dress,
            name: order.dressName || order.dress || '',
            code: order.dressCode || '',
            size: order.size || '',
          },
        ]
    ).map((it) => ({
      dressId: it.dressId?._id || it.dressId || it.id || '',
      name: it.name || '',
      code: it.code || '',
      size: (it.size || '').replace(/^size\s*/i, '').trim(),
    }));

    records[orderId] = {
      orderId,
      orderCode: order.orderCode || '',
      completedAt: Date.now(),
      maintenanceUntil: Date.now() + ONE_DAY_MS,
      items,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Lỗi ghi nhận bảo dưỡng đơn hoàn tất:', err);
  }
};

/**
 * Lấy danh sách các bảo dưỡng đang còn hiệu lực (< 1 ngày) từ các đơn đã hoàn tất
 */
export const getActiveCompletedMaintenances = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const records = JSON.parse(raw);
    const now = Date.now();
    const active = [];
    let hasExpired = false;

    for (const key of Object.keys(records)) {
      const rec = records[key];
      if (rec.maintenanceUntil && Number(rec.maintenanceUntil) > now) {
        active.push(rec);
      } else {
        delete records[key];
        hasExpired = true;
      }
    }

    if (hasExpired) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }

    return active;
  } catch {
    return [];
  }
};

/**
 * Tính toán nhanh số lượng mẫu và chiếc váy đang bảo dưỡng đồng bộ 100% với Quản lý kho hàng
 */
export const calculateInventoryMaintenanceSummary = async () => {
  try {
    const [dressesRes, ordersRes] = await Promise.all([
      getAllDresses().catch(() => ({ data: [] })),
      getAllOrdersAdmin({ limit: 150 }).catch(() => ({ orders: [] })),
    ]);

    const dressList = Array.isArray(dressesRes?.data) ? dressesRes.data : [];
    const orderList = Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];

    let localOrders = [];
    try {
      localOrders = JSON.parse(localStorage.getItem('unibridal-orders') || '[]');
    } catch {}
    try {
      const lastOrder = JSON.parse(localStorage.getItem('unibridal-last-order') || 'null');
      if (lastOrder) localOrders.push(lastOrder);
    } catch {}

    const combinedOrders = [...orderList];
    localOrders.forEach((lo) => {
      const loCode = String(lo.orderCode || lo.id || lo._id || '');
      if (loCode && !combinedOrders.some((co) => String(co.orderCode || co.id || co._id) === loCode)) {
        combinedOrders.push(lo);
      }
    });

    let deletedIds = [];
    try {
      deletedIds = JSON.parse(localStorage.getItem('unibridal_deleted_dress_ids') || '[]');
    } catch {}

    const activeDressList = dressList.filter(
      (d) => !deletedIds.includes(d._id || d.id) && d.status !== 'retired'
    );

    let manualOverrides = {};
    try {
      manualOverrides = JSON.parse(localStorage.getItem('unibridal_inventory_overrides') || '{}');
    } catch {}

    const completedStorageMaintenances = getActiveCompletedMaintenances();
    const cleanStr = (s) => (s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, '') : '');
    const now = Date.now();

    let totalModelsInMaintenance = 0;
    let totalUnitsInMaintenance = 0;

    activeDressList.forEach((d) => {
      const dressId = d._id || d.id;
      const override = manualOverrides[dressId] || {};
      const dressCleanName = cleanStr(override.name || d.name);
      const dressCleanCode = cleanStr(override.code || d.code);

      const matchedOrders = combinedOrders.filter((o) => {
        const hasItem = (o.items || []).some((it) => {
          const itId = it.dressId?._id || it.dressId || it.id || it._id;
          const itCleanName = cleanStr(it.name);
          const itCleanCode = cleanStr(it.code);
          const idMatch = itId && (String(itId) === String(dressId) || (d._id && String(itId) === String(d._id)));
          const codeMatch = itCleanCode && dressCleanCode && itCleanCode === dressCleanCode;
          const exactNameMatch = itCleanName && dressCleanName && itCleanName === dressCleanName && dressCleanName.length >= 2;
          return idMatch || codeMatch || exactNameMatch;
        });
        const mainClean = cleanStr(o.dress);
        const mainMatch = mainClean && dressCleanName && mainClean === dressCleanName && dressCleanName.length >= 2;
        return hasItem || mainMatch;
      });

      const isOrderIn1DayMaintenance = (o) => {
        const st = String(o.rawStatus || o.status || '').toLowerCase();
        if (st !== 'completed' && st !== 'complete') return false;
        if (o.maintenanceUntil) return new Date(o.maintenanceUntil).getTime() > now;
        if (o.completedAt) return (now - new Date(o.completedAt).getTime()) < ONE_DAY_MS;
        if (o.actualReturnDate) return (now - new Date(o.actualReturnDate).getTime()) < ONE_DAY_MS;
        if (o.updatedAt) return (now - new Date(o.updatedAt).getTime()) < ONE_DAY_MS;
        return false;
      };

      const maintenanceOrders = matchedOrders.filter((o) => {
        const isDirectMaint = ['returned', 'inspecting', 'maintenance'].includes(o.rawStatus || o.status);
        const isCompleted1Day = isOrderIn1DayMaintenance(o);
        return isDirectMaint || isCompleted1Day;
      });

      const completedStorageItemsForThisDress = [];
      completedStorageMaintenances.forEach((rec) => {
        (rec.items || []).forEach((it) => {
          const itId = String(it.dressId || '');
          const itCode = cleanStr(it.code);
          const itName = cleanStr(it.name);
          const idMatch = itId && (itId === String(dressId) || (d._id && itId === String(d._id)));
          const codeMatch = itCode && dressCleanCode && itCode === dressCleanCode;
          const nameMatch = itName && dressCleanName && itName === dressCleanName && dressCleanName.length >= 2;
          if (idMatch || codeMatch || nameMatch) {
            completedStorageItemsForThisDress.push({
              orderId: String(rec.orderId || ''),
              size: String(it.size || '').replace(/^size\s*/i, '').trim(),
            });
          }
        });
      });

      let sizeList = [];
      if (override.sizes && Array.isArray(override.sizes) && override.sizes.length > 0) {
        sizeList = override.sizes;
      } else {
        const defaultSizes = Array.isArray(d.sizes) && d.sizes.length > 0 ? d.sizes : ['S', 'M'];
        sizeList = defaultSizes.map((sz) => {
          if (typeof sz === 'object' && sz.size) {
            return { size: sz.size, quantity: sz.quantity ?? 2 };
          }
          const sName = typeof sz === 'object' ? (sz.label || 'S') : sz;
          return { size: sName, quantity: 2 };
        });
      }

      let dressMaintUnits = 0;
      sizeList.forEach((sz) => {
        const sName = String(sz.size || '').trim();
        const sQty = Number(sz.quantity) || 0;

        const orderMaintCount = maintenanceOrders.filter((o) => {
          const matchedItem = (o.items || []).find((it) => {
            const itId = it.dressId?._id || it.dressId || it.id || it._id;
            const itCleanName = cleanStr(it.name);
            const itCleanCode = cleanStr(it.code);
            return (
              (itId && (String(itId) === String(dressId) || (d._id && String(itId) === String(d._id)))) ||
              (itCleanCode && dressCleanCode && itCleanCode === dressCleanCode) ||
              (itCleanName && dressCleanName && itCleanName === dressCleanName && dressCleanName.length >= 2)
            );
          });
          const itemSize = String(matchedItem?.size || o.size || '').replace(/^size\s*/i, '').trim();
          return itemSize.toUpperCase() === sName.toUpperCase();
        }).length;

        const existingOrderIds = new Set(maintenanceOrders.map((o) => String(o._id || o.id || o.orderCode || '')));
        const storageMaintCount = completedStorageItemsForThisDress.filter((it) => {
          if (existingOrderIds.has(String(it.orderId))) return false;
          return it.size.toUpperCase() === sName.toUpperCase();
        }).length;

        const manualMaintCount = Number(
          override.maintenanceSizes?.[sName] ??
          override.maintenanceSizes?.[sName.toUpperCase()] ??
          0
        );

        const sMaint = Math.min(sQty, orderMaintCount + storageMaintCount + manualMaintCount);
        dressMaintUnits += sMaint;
      });

      const isDryingManual = override.statusType === 'drying';
      if (isDryingManual || dressMaintUnits > 0) {
        totalModelsInMaintenance++;
        totalUnitsInMaintenance += Math.max(1, dressMaintUnits);
      }
    });

    localStorage.setItem('unibridal_inventory_maintenance_count', String(totalModelsInMaintenance));
    localStorage.setItem('unibridal_inventory_maintenance_units', String(totalUnitsInMaintenance));

    return {
      count: totalModelsInMaintenance,
      units: totalUnitsInMaintenance,
    };
  } catch (err) {
    console.warn('Lỗi tính toán bảo dưỡng kho:', err);
    const cachedCount = localStorage.getItem('unibridal_inventory_maintenance_count');
    const cachedUnits = localStorage.getItem('unibridal_inventory_maintenance_units');
    return {
      count: cachedCount !== null ? Number(cachedCount) : null,
      units: cachedUnits !== null ? Number(cachedUnits) : null,
    };
  }
};


