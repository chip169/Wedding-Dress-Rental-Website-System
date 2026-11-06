import React, { useState, useMemo, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Search,
  ChevronDown,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
  MoreVertical,
  Check,
  Sparkles,
  RefreshCw,
  Layers,
  Trash2,
  Banknote,
  ShieldCheck,
  Percent,
  TableProperties,
  ChevronUp,
} from 'lucide-react';
import HangerIcon from '../../components/common/HangerIcon';
import { getAllDresses, deleteDress } from '../../services/dressService';
import { getAllOrdersAdmin } from '../../services/orderService';
import { formatCurrencyVND } from '../../utils/formatCurrency';

const fmtVnd = (v) => formatCurrencyVND(v ?? 0);

import card1Elysian from '../../assets/card1_elysian.jpg';

const PAGE_SIZE = 6;

export default function InventoryManagement() {
  const [rawDresses, setRawDresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showMatrixTable, setShowMatrixTable] = useState(false);

  // State cho Modal Sửa Sản Phẩm (Edit Modal)
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('Tủ A1');
  const [editRentPrice, setEditRentPrice] = useState(5000000);
  const [editDepositAmount, setEditDepositAmount] = useState(15000000);
  const [editStatusType, setEditStatusType] = useState('auto');
  const [editDescription, setEditDescription] = useState('');
  const [editSizes, setEditSizes] = useState({ XS: 0, S: 2, M: 2, L: 0, XL: 0 });

  // Form thêm sản phẩm kho mới
  const [newName, setNewName] = useState('');
  const [newCollection, setNewCollection] = useState('ATELIER COUTURE 2026');
  const [newLocation, setNewLocation] = useState('Tủ A1');
  const [newRentPrice, setNewRentPrice] = useState(5000000);
  const [newDepositAmount, setNewDepositAmount] = useState(15000000);
  const [newDescription, setNewDescription] = useState('');
  const [newSizeS, setNewSizeS] = useState(2);
  const [newSizeM, setNewSizeM] = useState(2);

  // Lưu trữ can thiệp chỉnh sửa của Staff/Admin
  const [manualOverrides, setManualOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('unibridal_inventory_overrides') || '{}');
    } catch {
      return {};
    }
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Hàm tiện ích chuẩn hóa chuỗi để so khớp chính xác
  const cleanStr = (s) => (s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, '') : '');

  // Tính toán tình trạng kho và liên kết đơn thuê tự động
  const computeItemData = useCallback((d, index, orderList, overrides) => {
    const dressId = d._id || d.id || `inv_${index + 1}`;
    const override = overrides[dressId] || {};

    const num = (index + 1).toString().padStart(2, '0');
    const code = d.code || `UB-${(index + 1).toString().padStart(3, '0')}`;
    const cabinets = ['Tủ A1', 'Tủ B2', 'Tủ C1', 'Tủ VIP', 'Tủ D3'];
    const location = override.location || cabinets[index % cabinets.length];

    // Xử lý sizes và số lượng tồn kho
    let sizeList = [];
    if (override.sizes && Array.isArray(override.sizes) && override.sizes.length > 0) {
      sizeList = override.sizes;
    } else {
      const defaultSizes = Array.isArray(d.sizes) && d.sizes.length > 0 ? d.sizes : ['S', 'M'];
      sizeList = defaultSizes.map((sz) => {
        if (typeof sz === 'object' && sz.size) {
          return { size: sz.size, quantity: sz.quantity ?? 2, label: `Size ${sz.size} (${sz.quantity ?? 2} bộ)` };
        }
        const sName = typeof sz === 'object' ? (sz.label || 'S') : sz;
        return { size: sName, quantity: 2, label: `Size ${sName} (2 bộ)` };
      });
    }

    const totalStock = sizeList.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

    // Tính toán liên kết với đơn thuê thực tế (Orders)
    const dressName = (d.name || '').trim().toLowerCase();
    const dressCleanName = cleanStr(d.name);
    const dressCleanCode = cleanStr(code);

    const matchedOrders = (orderList || []).filter((o) => {
      const hasItem = (o.items || []).some((it) => {
        const itId = it.dressId?._id || it.dressId || it.id || it._id;
        const itName = (it.name || '').trim().toLowerCase();
        const itCleanName = cleanStr(it.name);
        const itCode = cleanStr(it.code);
        const idMatch = itId && String(itId) === String(dressId);
        const nameMatch =
          itName &&
          (itName === dressName ||
            itName.includes(dressName) ||
            dressName.includes(itName) ||
            (itCleanName && dressCleanName && (itCleanName === dressCleanName || dressCleanName.includes(itCleanName) || itCleanName.includes(dressCleanName))));
        const codeMatch = itCode && dressCleanCode && itCode === dressCleanCode;
        return idMatch || nameMatch || codeMatch;
      });
      const mainDress = String(o.dress || '').trim().toLowerCase();
      const mainClean = cleanStr(mainDress);
      const mainMatch =
        mainDress &&
        (mainDress === dressName ||
          mainDress.includes(dressName) ||
          dressName.includes(mainDress) ||
          (mainClean && dressCleanName && (mainClean === dressCleanName || dressCleanName.includes(mainClean))));
      return hasItem || mainMatch;
    });

    const relatedOrderCodes = matchedOrders.map((o) =>
      String(o.orderCode || o.id || o._id || '').toLowerCase()
    );

    // 1. Số lượng đơn đang trong chu trình kiểm định & bảo dưỡng sau thuê
    const maintenanceOrders = matchedOrders.filter((o) =>
      ['returned', 'inspecting', 'maintenance'].includes(o.rawStatus || o.status)
    );
    const maintenanceCount = maintenanceOrders.length;

    // 2. Số lượng đang được khách thuê / chuẩn bị giao
    const rentingOrders = matchedOrders.filter((o) =>
      ['renting', 'delivered', 'preparing', 'deposit_paid'].includes(o.rawStatus || o.status)
    );
    const rentedCount = rentingOrders.length;

    // 3. Phân bổ chi tiết theo từng Size: Khả dụng / Đang kiểm định / Đang thuê
    const detailedSizes = sizeList.map((sz) => {
      const sName = String(sz.size || '').trim();
      const sQty = Number(sz.quantity) || 0;

      const sMaint = maintenanceOrders.filter((o) => {
        const itemSize = (o.items || []).find((it) => {
          const itId = it.dressId?._id || it.dressId || it.id || it._id;
          const itName = (it.name || '').trim().toLowerCase();
          return (itId && String(itId) === String(dressId)) || (itName && itName.includes(dressName));
        })?.size || o.size || '';
        return String(itemSize).toUpperCase() === sName.toUpperCase();
      }).length;

      const sRented = rentingOrders.filter((o) => {
        const itemSize = (o.items || []).find((it) => {
          const itId = it.dressId?._id || it.dressId || it.id || it._id;
          const itName = (it.name || '').trim().toLowerCase();
          return (itId && String(itId) === String(dressId)) || (itName && itName.includes(dressName));
        })?.size || o.size || '';
        return String(itemSize).toUpperCase() === sName.toUpperCase();
      }).length;

      const sAvail = Math.max(0, sQty - sMaint - sRented);
      return {
        ...sz,
        available: sAvail,
        maintenance: sMaint,
        rented: sRented,
      };
    });

    // 4. Số lượng khả dụng sẵn sàng phục vụ trong kho
    const availableStock = Math.max(0, totalStock - rentedCount - maintenanceCount);

    // Xử lý trạng thái: Tự động vs Thủ công
    const manualStatus = override.statusType || null;
    let statusType = manualStatus && manualStatus !== 'auto' ? manualStatus : 'auto';
    let statusText = 'CÒN HÀNG';
    let statusSubNote = '';

    if (statusType === 'auto') {
      if (maintenanceCount > 0) {
        statusType = 'drying';
        statusText = 'ĐANG BẢO DƯỠNG';
        statusSubNote = `Kiểm định sau thuê (${maintenanceCount} bộ)`;
      } else if (availableStock <= 0 && totalStock > 0) {
        statusType = 'out_of_stock';
        statusText = 'HẾT HÀNG';
        statusSubNote = `Đã xuất thuê toàn bộ (${totalStock} bộ)`;
      } else if (rentedCount > 0) {
        statusType = 'stored';
        statusText = 'CÒN HÀNG';
        statusSubNote = `Đang thuê: ${rentedCount} bộ`;
      } else {
        statusType = 'stored';
        statusText = 'CÒN HÀNG';
        statusSubNote = '';
      }
    } else if (statusType === 'drying') {
      statusText = 'ĐANG BẢO DƯỠNG';
      statusSubNote = maintenanceCount > 0 ? `Đang kiểm định & bảo dưỡng (${maintenanceCount} bộ)` : 'Giặt khô, là hơi phục hồi';
    } else if (statusType === 'ready') {
      statusText = 'ĐÃ CHO THUÊ';
      statusSubNote = 'Đang phục vụ cô dâu';
    } else if (statusType === 'out_of_stock') {
      statusText = 'HẾT HÀNG';
      statusSubNote = 'Tạm hết mẫu này trong kho';
    } else {
      statusType = 'stored';
      statusText = 'CÒN HÀNG';
      statusSubNote = '';
    }

    return {
      id: dressId,
      code,
      name: override.name || d.name,
      collection: d.collection || '',
      rfid: `#RF-2026-${(index + 1).toString().padStart(4, '0')}`,
      location,
      statusType,
      statusText,
      statusSubNote,
      manualStatus,
      totalStock,
      availableStock,
      rentedCount,
      maintenanceCount,
      relatedOrderCodes,
      customerNames: matchedOrders.map((o) => (o.customerName || '').toLowerCase()),
      customerPhones: matchedOrders.map((o) => (o.customerPhone || '').toLowerCase()),
      matchedOrders,
      sizes: detailedSizes,
      totalUnits: `Tổng: ${String(totalStock).padStart(2, '0')} bộ`,
      description: override.description || d.description || 'Lễ phục cưới cao cấp UniBridal Haute Couture',
      rentPrice: override.rentPrice ?? d.rentPrice ?? d.price ?? 5000000,
      depositAmount: override.depositAmount ?? d.depositAmount ?? d.deposit ?? 15000000,
      image: (d.images && d.images[0]) || d.image || `/assets/dresses/dress_${num}.jpg`,
    };
  }, []);

  // Tải đồng thời dữ liệu Váy Cưới và Đơn Hàng thực tế
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const [dressesRes, ordersRes] = await Promise.all([
        getAllDresses(),
        getAllOrdersAdmin({ limit: 150 }),
      ]);

      const dressList = Array.isArray(dressesRes?.data) ? dressesRes.data : [];
      const orderList = Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];

      // Gộp thêm các đơn từ localStorage nếu có (ví dụ đơn khách hàng vừa đặt hoặc offline)
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('unibridal-orders') || '[]');
      } catch { }
      try {
        const lastOrder = JSON.parse(localStorage.getItem('unibridal-last-order') || 'null');
        if (lastOrder) localOrders.push(lastOrder);
      } catch { }

      const combinedOrders = [...orderList];
      localOrders.forEach((lo) => {
        const loCode = String(lo.orderCode || lo.id || lo._id || '');
        if (loCode && !combinedOrders.some((co) => String(co.orderCode || co.id || co._id) === loCode)) {
          combinedOrders.push(lo);
        }
      });

      // Lấy danh sách ID đã xóa từ localStorage (nếu có) để lọc bỏ
      let deletedIds = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem('unibridal_deleted_dress_ids') || '[]');
      } catch { }

      const activeDressList = dressList.filter(
        (d) => !deletedIds.includes(d._id || d.id) && d.status !== 'retired'
      );

      setRawDresses(activeDressList);
      setOrders(combinedOrders);

      const computed = activeDressList.map((d, index) =>
        computeItemData(d, index, combinedOrders, manualOverrides)
      );
      setItems(computed);
      setError('');
    } catch (err) {
      console.error('Error loading inventory data:', err);
      setError('Lỗi kết nối cơ sở dữ liệu: Không thể tải danh sách kho hàng từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [computeItemData, manualOverrides]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Bộ lọc trạng thái
  const statusOptions = [
    { value: 'all', label: 'Tất Cả Tình Trạng' },
    { value: 'stored', label: 'Còn Hàng' },
    { value: 'ready', label: 'Đã Cho Thuê' },
    { value: 'drying', label: 'Đang Bảo Dưỡng' },
    { value: 'out_of_stock', label: 'Hết Hàng' },
  ];

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.code || '').toLowerCase().includes(q) ||
        (item.location || '').toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'all' ||
        item.statusType === statusFilter ||
        (statusFilter === 'drying' &&
          (item.statusType === 'drying' || (item.maintenanceCount && item.maintenanceCount > 0))) ||
        (statusFilter === 'stored' &&
          (item.statusType === 'stored' || item.statusType === 'partially_rented')) ||
        (statusFilter === 'ready' &&
          (item.statusType === 'out_of_stock' ||
            item.statusType === 'ready' ||
            item.statusType === 'partially_rented' ||
            (item.rentedCount && item.rentedCount > 0)));

      return matchSearch && matchStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const pageNumbers = useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (activePage < 3) {
      return [1, 2, 3, '...', totalPages - 1, totalPages];
    }
    if (activePage >= totalPages - 2) {
      return ['...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    if (activePage + 2 >= totalPages - 1) {
      return ['...', activePage - 1, activePage, activePage + 1, totalPages - 1, totalPages];
    }
    return ['...', activePage - 1, activePage, activePage + 1, '...', totalPages - 1, totalPages];
  }, [activePage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, activePage]);

  useEffect(() => {
    setActivePage(1);
  }, [searchTerm, statusFilter]);

  // Cập nhật nhanh trạng thái qua dropdown 3 chấm
  const handleUpdateItemStatus = (itemId, newStatusType, newStatusLabel) => {
    const updatedOverrides = {
      ...manualOverrides,
      [itemId]: {
        ...(manualOverrides[itemId] || {}),
        statusType: newStatusType,
      },
    };
    setManualOverrides(updatedOverrides);
    try {
      localStorage.setItem('unibridal_inventory_overrides', JSON.stringify(updatedOverrides));
    } catch { }

    // Cập nhật lại state items tức thời
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          return computeItemData(
            rawDresses.find((d) => (d._id || d.id) === itemId) || it,
            0,
            orders,
            updatedOverrides
          );
        }
        return it;
      })
    );
    setActionMenuOpenId(null);
    showToast(`Đã cập nhật trạng thái: ${newStatusLabel}`);
  };

  // Mở Modal Sửa Sản Phẩm
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setEditName(item.name || '');
    setEditLocation(item.location || 'Tủ A1');
    setEditRentPrice(item.rentPrice || 5000000);
    setEditDepositAmount(item.depositAmount || 15000000);
    setEditStatusType(item.manualStatus || 'auto');
    setEditDescription(item.description || '');

    const sizeMap = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
    (item.sizes || []).forEach((sz) => {
      const sName = typeof sz === 'object' ? sz.size : sz;
      const qty = typeof sz === 'object' ? (sz.quantity ?? 2) : 2;
      if (sizeMap[sName] !== undefined) sizeMap[sName] = qty;
    });
    if (Object.values(sizeMap).every((v) => v === 0)) {
      sizeMap.S = 2;
      sizeMap.M = 2;
    }
    setEditSizes(sizeMap);
  };

  // Lưu chỉnh sửa sản phẩm kho
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const newSizesArray = Object.entries(editSizes)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([sz, qty]) => ({
        size: sz,
        quantity: Number(qty),
        label: `Size ${sz} (${qty} bộ)`,
      }));

    const updatedOverrides = {
      ...manualOverrides,
      [editingItem.id]: {
        ...(manualOverrides[editingItem.id] || {}),
        name: editName.trim(),
        location: editLocation.trim(),
        rentPrice: Number(editRentPrice || 0),
        depositAmount: Number(editDepositAmount || 0),
        statusType: editStatusType,
        description: editDescription.trim(),
        sizes: newSizesArray,
      },
    };

    setManualOverrides(updatedOverrides);
    try {
      localStorage.setItem('unibridal_inventory_overrides', JSON.stringify(updatedOverrides));
    } catch { }

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === editingItem.id) {
          return computeItemData(
            rawDresses.find((d) => (d._id || d.id) === editingItem.id) || it,
            0,
            orders,
            updatedOverrides
          );
        }
        return it;
      })
    );

    setEditingItem(null);
    showToast(`Đã lưu thay đổi cho mẫu váy "${editName}" thành công!`);
  };

  // Xử lý nộp phiếu nhập kho mới
  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Vui lòng nhập tên mẫu váy cưới.');
      return;
    }

    const newCode = `KHO-${newCollection.slice(0, 4).toUpperCase()}-${String(items.length + 1).padStart(2, '0')}`;
    const totalCount = Number(newSizeS || 0) + Number(newSizeM || 0);

    const newItem = {
      id: `new_${Date.now()}`,
      name: newName.trim(),
      code: newCode,
      collection: newCollection.trim(),
      image: card1Elysian,
      location: newLocation.trim(),
      rfid: `#RF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      description: newDescription.trim() || 'Lễ phục cưới cao cấp bảo quản tiêu chuẩn vi khí hậu.',
      rentPrice: Number(newRentPrice || 5000000),
      depositAmount: Number(newDepositAmount || 15000000),
      totalStock: totalCount,
      availableStock: totalCount,
      rentedCount: 0,
      inspectingCount: 0,
      statusType: 'stored',
      statusText: 'CÒN HÀNG',
      statusSubNote: '',
      sizes: [
        { size: 'S', quantity: Number(newSizeS || 2), label: `Size S (${String(newSizeS).padStart(2, '0')} bộ)` },
        { size: 'M', quantity: Number(newSizeM || 2), label: `Size M (${String(newSizeM).padStart(2, '0')} bộ)` },
      ],
      totalUnits: `Tổng: ${String(totalCount).padStart(2, '0')} bộ`,
    };

    setItems([newItem, ...items]);
    setIsAddModalOpen(false);
    setNewName('');
    showToast(`Đã nhập kho thành công mẫu váy: ${newItem.name}`);
  };

  // Quản lý xóa mẫu váy khỏi kho
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConfirmDeleteItem = (item) => {
    setActionMenuOpenId(null);
    setDeletingItem(item);
  };

  const handleExecuteDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    try {
      // 1. Gọi API Backend nếu là mẫu váy có ID trong database
      if (deletingItem.id && !String(deletingItem.id).startsWith('new_')) {
        try {
          await deleteDress(deletingItem.id);
        } catch (apiErr) {
          console.warn('API delete dress warning:', apiErr);
        }
      }

      // 2. Ghi nhận ID đã xóa vào localStorage để không bị tải lại khi reload
      try {
        const deletedIds = JSON.parse(localStorage.getItem('unibridal_deleted_dress_ids') || '[]');
        if (!deletedIds.includes(deletingItem.id)) {
          deletedIds.push(deletingItem.id);
          localStorage.setItem('unibridal_deleted_dress_ids', JSON.stringify(deletedIds));
        }
      } catch { }

      // 3. Xóa override nếu có
      if (manualOverrides[deletingItem.id]) {
        const nextOverrides = { ...manualOverrides };
        delete nextOverrides[deletingItem.id];
        setManualOverrides(nextOverrides);
        try {
          localStorage.setItem('unibridal_inventory_overrides', JSON.stringify(nextOverrides));
        } catch { }
      }

      // 4. Cập nhật state UI ngay lập tức
      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      setRawDresses((prev) => prev.filter((d) => (d._id || d.id) !== deletingItem.id));

      showToast(`Đã xóa thành công mẫu váy "${deletingItem.name}" khỏi kho!`);
      setDeletingItem(null);
    } catch (err) {
      console.error('Lỗi khi xóa mẫu váy khỏi kho:', err);
      showToast('Có lỗi xảy ra khi xóa mẫu váy khỏi kho.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Đếm các số liệu tổng quan theo yêu cầu quản lý kho:
  // 1. Tổng số váy (tính tổng chiếc/bộ váy trên mọi size)
  const totalUnitsAll = items.reduce((sum, item) => sum + (item.totalStock || 0), 0);

  // 2. Tổng số mẫu (tổng số mẫu thiết kế lưu kho)
  const totalCount = items.length;

  // 3. Tổng số mẫu đang cho thuê (có đơn thuê hoặc trạng thái đã cho thuê)
  const rentedModelsCount = items.filter(
    (i) =>
      (i.rentedCount && i.rentedCount > 0) ||
      i.statusType === 'ready' ||
      i.statusType === 'partially_rented' ||
      i.statusType === 'out_of_stock'
  ).length;

  // 4. Tổng số mẫu đang bảo dưỡng (giặt khô, là hơi hoặc váy của các đơn đang kiểm định sau thuê)
  const maintenanceCount = items.filter(
    (i) => i.statusType === 'drying' || (i.maintenanceCount && i.maintenanceCount > 0)
  ).length;

  // 5. Tổng giá trị tài sản kho bảo lãnh
  const totalAssetValue = useMemo(() => {
    return items.reduce((sum, item) => sum + ((item.depositAmount || 15000000) * (item.totalStock || 1)), 0);
  }, [items]);

  // 6. Tổng số váy khả dụng sẵn sàng ngay
  const totalAvailableUnits = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.availableStock || 0), 0);
  }, [items]);

  // 7. Tổng số váy đang phục vụ cô dâu
  const totalRentedUnits = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.rentedCount || 0), 0);
  }, [items]);

  // 8. Tỷ lệ lấp đầy kho (%)
  const utilizationRate = totalUnitsAll > 0 ? Math.round((totalRentedUnits / totalUnitsAll) * 100) : 0;

  const selectedFilterLabel =
    statusOptions.find((o) => o.value === statusFilter)?.label || 'Tất Cả Tình Trạng';

  return (
    <AdminLayout activeMenu="inventory">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2C2523] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#443836] animate-slideUp">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadInventory}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border-0"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Page Title & Main CTA Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-[26px] sm:text-[30px] font-bold text-[#5F2B36] tracking-tight">
            Quản Lý Sản Phẩm Kho
          </h1>
          <p className="text-[13px] text-[#7A6B6C] mt-1">
            Theo dõi vị trí tủ, định mức giá, tồn kho theo size và trạng thái thực tế phụ thuộc đơn thuê.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowMatrixTable(!showMatrixTable)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-xs ${
              showMatrixTable
                ? 'bg-[#5F2B36] text-white border-[#5F2B36]'
                : 'bg-white text-[#5F2B36] border-[#E8DDD8] hover:bg-[#FAF0EC]'
            }`}
          >
            <TableProperties size={15} />
            <span>{showMatrixTable ? 'Ẩn Ma Trận Size' : 'Bảng Ma Trận Tồn Kho & Size'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8C4654] hover:from-[#5A2D35] hover:to-[#733F49] text-white text-xs font-bold transition-all cursor-pointer shadow-xs border-0"
          >
            <Plus size={15} />
            <span>Nhập Lễ Phục Mới</span>
          </button>
        </div>
      </div>

      {/* 4 Top Metric Cards Nâng Cấp: Tổng số váy, Tổng số mẫu, Đang cho thuê, Đang bảo dưỡng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: TỔNG MẪU THIẾT KẾ (Ánh hồng thanh lịch) */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FDE8EC_0%,_transparent_70%)] rounded-2xl border border-[#FAD2DA] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#733F49] uppercase">
                TỔNG MẪU THIẾT KẾ
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#733F49]">
                <Layers size={18} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[32px] font-bold text-[#2C2523] leading-none">
                {totalCount}
              </span>
              <span className="text-[12px] font-medium text-[#8C7D7E] ml-2">mẫu thiết kế</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F8E2E6] flex items-center justify-between text-[11px]">
            <span className="text-[#8A797A]">Giá trị cọc bảo lãnh:</span>
            <span className="font-bold text-[#733F49]">{fmtVnd(totalAssetValue)}</span>
          </div>
        </div>

        {/* Card 2: TỔNG SỐ VÁY (Ánh xanh lá dịu mát) */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#EAF8EE_0%,_transparent_70%)] rounded-2xl border border-[#C6EED1] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#1E8347] uppercase">
                TỔNG SỐ LỄ PHỤC
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#EAF8EE] flex items-center justify-center text-[#1E8347]">
                <HangerIcon size={18} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[32px] font-bold text-[#1E8347] leading-none">
                {totalUnitsAll}
              </span>
              <span className="text-[12px] font-medium text-[#736364] ml-2">chiếc váy</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#D5F3DD] flex items-center justify-between text-[11px]">
            <span className="text-[#5E7A67]">Khả dụng tại tủ:</span>
            <span className="font-bold text-[#1E8347]">{totalAvailableUnits} chiếc sẵn sàng</span>
          </div>
        </div>

        {/* Card 3: MẪU ĐANG CHO THUÊ */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#EFF6FF_0%,_transparent_70%)] rounded-2xl border border-[#BFDBFE] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#1D4ED8] uppercase">
                LỄ PHỤC ĐI THUÊ
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8]">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[32px] font-bold text-[#1E3A8A] leading-none">
                {rentedModelsCount}
              </span>
              <span className="text-[12px] font-medium text-[#60A5FA] ml-2">
                mẫu ({totalCount > 0 ? Math.round((rentedModelsCount / totalCount) * 100) : 0}%)
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#DBEAFE] flex items-center justify-between text-[11px]">
            <span className="text-[#4B6B94]">Tỷ lệ lấp đầy:</span>
            <span className="font-bold text-[#1D4ED8]">{utilizationRate}% ({totalRentedUnits} chiếc)</span>
          </div>
        </div>

        {/* Card 4: MẪU ĐANG BẢO DƯỠNG */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FEF3C7_0%,_transparent_70%)] rounded-2xl border border-[#FDE68A] p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#92400E] uppercase">
                MẪU ĐANG BẢO DƯỠNG
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FEF2E6] flex items-center justify-center text-[#D97706]">
                <Clock size={18} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[32px] font-bold text-[#78350F] leading-none">
                {maintenanceCount}
              </span>
              <span className="text-[12px] font-medium text-[#D97706] ml-2">mẫu đang xử lý</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#FDE68A] flex items-center justify-between text-[11px]">
            <span className="text-[#855B1B]">Tiêu chuẩn:</span>
            <span className="font-bold text-[#92400E]">Giặt khô & vi khí hậu</span>
          </div>
        </div>
      </div>

      {/* NÂNG CẤP: Bảng Ma Trận Tồn Kho Chi Tiết Theo Size (Hiển thị khi bật nút toggle) */}
      {showMatrixTable && (
        <section className="bg-white rounded-2xl border border-[#EFE5E1] p-6 shadow-xs mb-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#F4EBE7]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF0EC] flex items-center justify-center text-[#733F49]">
                <TableProperties size={17} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2C2523] uppercase tracking-wider">
                  Bảng Ma Trận Tồn Kho Theo Size & Tình Trạng Lễ Phục
                </h3>
                <p className="text-xs text-[#8A797A]">Đối soát chi tiết từng kích cỡ và số lượng sẵn sàng phục vụ tại showroom</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                <CheckCircle2 size={13} /> {totalAvailableUnits} chiếc sẵn sàng
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                <Sparkles size={13} /> {totalRentedUnits} chiếc đang cho thuê
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF5F2] text-[#705F60] font-bold uppercase tracking-wider text-[11px] border-b border-[#EFE2DC]">
                  <th className="py-3 px-3.5">Mã Váy</th>
                  <th className="py-3 px-3.5">Tên Mẫu Thiết Kế</th>
                  <th className="py-3 px-3 text-center">Vị Trí Tủ</th>
                  <th className="py-3 px-2 text-center bg-[#FDF8F6]">Size XS</th>
                  <th className="py-3 px-2 text-center bg-[#FDF8F6]">Size S</th>
                  <th className="py-3 px-2 text-center bg-[#FDF8F6]">Size M</th>
                  <th className="py-3 px-2 text-center bg-[#FDF8F6]">Size L</th>
                  <th className="py-3 px-3 text-center font-bold">Tổng Bộ</th>
                  <th className="py-3 px-3 text-center text-emerald-700">Khả Dụng</th>
                  <th className="py-3 px-3 text-center text-blue-700">Đang Thuê</th>
                  <th className="py-3 px-3 text-center text-amber-700">Bảo Dưỡng</th>
                  <th className="py-3 px-3.5 text-right">Tiền Cọc Niêm Yết</th>
                  <th className="py-3 px-3 text-center">Tình Trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5EAE6]">
                {items.map((it) => {
                  const szXS = (it.sizes || []).find((s) => s.size?.toUpperCase() === 'XS')?.quantity || 0;
                  const szS = (it.sizes || []).find((s) => s.size?.toUpperCase() === 'S')?.quantity || 0;
                  const szM = (it.sizes || []).find((s) => s.size?.toUpperCase() === 'M')?.quantity || 0;
                  const szL = (it.sizes || []).find((s) => s.size?.toUpperCase() === 'L')?.quantity || 0;

                  return (
                    <tr key={it.id} className="hover:bg-[#FFFDFB] transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-[#733F49]">
                        {it.code}
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-[#2C2523]">
                        {it.name}
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#705F60]">
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF2EE] text-[11px] font-semibold border border-[#EFE2DC]">
                          {it.location || 'Tủ A1'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center bg-[#FFFBF9] font-medium text-[#5D4E50]">
                        {szXS > 0 ? szXS : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center bg-[#FFFBF9] font-medium text-[#5D4E50]">
                        {szS > 0 ? szS : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center bg-[#FFFBF9] font-medium text-[#5D4E50]">
                        {szM > 0 ? szM : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center bg-[#FFFBF9] font-medium text-[#5D4E50]">
                        {szL > 0 ? szL : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#2C2523]">
                        {it.totalStock}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {it.availableStock}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-blue-700">
                        {it.rentedCount > 0 ? it.rentedCount : '0'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-amber-700">
                        {it.maintenanceCount > 0 ? it.maintenanceCount : '0'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-medium text-[#733F49]">
                        {fmtVnd(it.depositAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          it.statusType === 'drying' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          it.statusType === 'out_of_stock' ? 'bg-red-50 text-red-700 border border-red-200' :
                          it.statusType === 'ready' || it.statusType === 'partially_rented' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {it.statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Hàng Tổng Cộng Kho */}
                <tr className="bg-[#FAF0EC] font-bold text-[#2C2523] border-t-2 border-[#EAD5CF]">
                  <td colSpan={3} className="py-3 px-3.5 text-xs font-playfair uppercase">
                    TỔNG CỘNG TOÀN KHO SHOWROOM
                  </td>
                  <td className="py-3 px-2 text-center bg-[#FAF0EC]">
                    {items.reduce((sum, it) => sum + ((it.sizes || []).find((s) => s.size?.toUpperCase() === 'XS')?.quantity || 0), 0)}
                  </td>
                  <td className="py-3 px-2 text-center bg-[#FAF0EC]">
                    {items.reduce((sum, it) => sum + ((it.sizes || []).find((s) => s.size?.toUpperCase() === 'S')?.quantity || 0), 0)}
                  </td>
                  <td className="py-3 px-2 text-center bg-[#FAF0EC]">
                    {items.reduce((sum, it) => sum + ((it.sizes || []).find((s) => s.size?.toUpperCase() === 'M')?.quantity || 0), 0)}
                  </td>
                  <td className="py-3 px-2 text-center bg-[#FAF0EC]">
                    {items.reduce((sum, it) => sum + ((it.sizes || []).find((s) => s.size?.toUpperCase() === 'L')?.quantity || 0), 0)}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-bold text-[#2C2523]">
                    {totalUnitsAll}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-bold text-emerald-700">
                    {totalAvailableUnits}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-bold text-blue-700">
                    {totalRentedUnits}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-bold text-amber-700">
                    {items.reduce((sum, it) => sum + (it.maintenanceCount || 0), 0)}
                  </td>
                  <td className="py-3 px-3.5 text-right text-xs font-bold text-[#733F49]">
                    {fmtVnd(totalAssetValue)}
                  </td>
                  <td className="py-3 px-3 text-center text-[11px] text-emerald-700">
                    Sẵn sàng {totalAvailableUnits}/{totalUnitsAll}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#EFE5E1] p-4 shadow-xs mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A8B8C]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã váy, tên thiết kế, vị trí tủ..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FFF6F3] border border-[#F4E8E3] focus:border-[#B8737D] focus:bg-white text-[13px] text-[#2C2523] placeholder-[#A39293] outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A39293] hover:text-[#5F333B] cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex justify-end items-center mt-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-[#FAF2EE] border border-[#EFE2DC] text-[12.5px] text-[#554748] font-medium hover:bg-[#F3E7E2] transition-colors cursor-pointer"
            >
              <span>{selectedFilterLabel}</span>
              <ChevronDown
                size={14}
                className={`text-[#8C7D7E] transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-[#EFE5E1] py-1.5 z-20 animate-fadeIn">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-left text-[13px] transition-colors cursor-pointer ${statusFilter === opt.value
                      ? 'bg-[#F9EDE9] text-[#733F49] font-bold'
                      : 'bg-transparent text-[#5F4E50] hover:bg-[#FAF5F2]'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {statusFilter === opt.value && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F2E5E0] bg-[#FFF6F3]">
                <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase w-[25%] min-w-[210px]">
                  SẢN PHẨM &amp; MÃ VÁY
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase w-[18%] min-w-[160px]">
                  VỊ TRÍ TỦ
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase w-[17%] min-w-[150px]">
                  GIÁ THUÊ &amp; CỌC
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center w-[18%] min-w-[160px]">
                  TỒN KHO THEO SIZE
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center w-[13%] min-w-[140px]">
                  TÌNH TRẠNG KHO
                </th>
                <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center w-[9%] min-w-[100px]">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6EDE9]">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-[#8C7D7E] text-sm">
                    Không tìm thấy sản phẩm kho nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-[#FCF9F7] transition-colors">
                      {/* Col 1: Sản phẩm */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-xl object-cover border border-[#EFE5E1] shadow-2xs shrink-0 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => handleOpenEditModal(item)}
                          />
                          <div className="flex flex-col gap-1 items-start">
                            <div
                              onClick={() => handleOpenEditModal(item)}
                              className="font-jakarta text-[14px] font-bold text-[#2C2523] hover:text-[#B8737D] cursor-pointer transition-colors leading-tight"
                            >
                              {item.name}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF0EC] text-[#733F49] font-mono text-[10.5px] font-bold border border-[#F2D8D4] leading-none">
                                {item.code}
                              </span>
                            </div>
                            {item.collection ? (
                              <div className="text-[10px] font-bold text-[#A39293] tracking-wider uppercase leading-none">
                                {item.collection}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Vị trí tủ */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 mb-1.5 whitespace-nowrap">
                          <HangerIcon size={16} strokeWidth={1.8} className="text-[#8A4650] shrink-0" />
                          <span className="font-bold text-[#2C2523] text-[13.5px] whitespace-nowrap">
                            {item.location}
                          </span>
                          <span className="px-2 py-0.5 rounded-md border border-[#E8DCD7] bg-[#FAF5F2] text-[#7A696B] font-mono text-[10px] font-semibold whitespace-nowrap shrink-0">
                            {item.rfid}
                          </span>
                        </div>
                        <div className="text-[11.5px] text-[#8A797A] line-clamp-2 max-w-[260px]">
                          {item.description}
                        </div>
                      </td>

                      {/* Col 3: Giá thuê & Cọc */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#733F49] text-[13.5px] leading-tight">
                          {fmtVnd(item.rentPrice)}
                        </div>
                        <div className="text-[11px] text-[#8C7D7E] mt-1 font-medium">
                          Cọc: <span className="font-semibold text-[#5F4E50]">{fmtVnd(item.depositAmount)}</span>
                        </div>
                      </td>

                      {/* Col 4: Tồn kho theo size */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <div className="text-[13.5px] font-bold text-[#2C2523] leading-tight">
                            Khả dụng:{' '}
                            <span className={item.availableStock < item.totalStock ? 'text-[#D97706]' : 'text-[#1E8347]'}>
                              {String(item.availableStock).padStart(2, '0')}
                            </span>
                            <span className="text-[11.5px] font-medium text-[#8C7D7E]"> / {String(item.totalStock || 0).padStart(2, '0')} bộ</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-1 mt-1.5">
                            {(Array.isArray(item.sizes) ? item.sizes : []).map((s, idx) => {
                              const sName = typeof s === 'object' ? s.size : s;
                              const sQty = typeof s === 'object' ? (s.quantity ?? 0) : 0;
                              const sAvail = typeof s === 'object' && s.available !== undefined ? s.available : sQty;
                              const sMaint = typeof s === 'object' ? (s.maintenance ?? 0) : 0;
                              const sRented = typeof s === 'object' ? (s.rented ?? 0) : 0;

                              return (
                                <span
                                  key={idx}
                                  title={sMaint > 0 ? `Đang có ${sMaint} bộ size ${sName} kiểm định sau thuê` : sRented > 0 ? `Đang có ${sRented} bộ size ${sName} đang được khách thuê` : `Sẵn sàng phục vụ: ${sAvail} bộ`}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded-md border font-semibold text-[10.5px] ${sMaint > 0
                                    ? 'bg-[#FEF2E6] text-[#B45309] border-[#FED7AA]'
                                    : sRented > 0
                                      ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'
                                      : 'bg-[#FAF5F2] text-[#733F49] border-[#EFE2DC]'
                                    }`}
                                >
                                  {sName}: <span className="font-bold ml-1 text-[#2C2523]">{sAvail}/{sQty}</span>
                                  {sMaint > 0 && <span className="ml-1 text-[9px] text-[#D97706] font-bold">({sMaint} bảo dưỡng)</span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Col 5: Tình trạng kho */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {item.statusType === 'stored' && (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase whitespace-nowrap bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                              <Sparkles size={12} className="text-[#1D4ED8]" />
                              <span>Còn Hàng</span>
                            </span>
                          )}
                          {item.statusType === 'ready' && (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase whitespace-nowrap bg-[#EAF7EE] text-[#1E8347] border border-[#BCE7C7]">
                              <CheckCircle2 size={12} className="text-[#1E8347]" />
                              <span>Đã Cho Thuê</span>
                            </span>
                          )}
                          {item.statusType === 'out_of_stock' && (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase whitespace-nowrap bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                              <AlertTriangle size={12} className="text-[#DC2626]" />
                              <span>Hết Hàng</span>
                            </span>
                          )}
                          {item.statusType === 'drying' && (
                            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase whitespace-nowrap bg-[#FEF2E6] text-[#D97706] border border-[#FED7AA]">
                              <Clock size={12} className="text-[#D97706]" />
                              <span>Đang Bảo Dưỡng</span>
                            </span>
                          )}

                          {/* Chú thích trạng thái rõ ràng, dễ hiểu */}
                          {item.statusSubNote && (
                            <span className="text-[11px] text-[#8C7A7B] font-medium leading-tight max-w-[170px] text-center">
                              {item.statusSubNote}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Col 6: Thao tác (Nút SỬA + NÚT XÓA + Menu Dropdown) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="relative inline-flex items-center justify-center gap-1.5 text-[#736364]">
                          {/* Nút Sửa thay thế nút Xem Chi Tiết */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title="Chỉnh sửa thông tin & kho váy"
                            className="px-2.5 py-1.5 rounded-xl bg-[#FAF0EC] text-[#733F49] hover:bg-[#F2DCD6] hover:text-[#5F2B36] transition-colors cursor-pointer flex items-center gap-1 text-[11.5px] font-bold border border-[#F2D8D4] shadow-2xs"
                          >
                            <Pencil size={13} />
                            <span>Sửa</span>
                          </button>

                          {/* Nút Xóa hàng ở kho */}
                          <button
                            type="button"
                            onClick={() => handleConfirmDeleteItem(item)}
                            title="Xóa mẫu váy khỏi kho"
                            className="px-2.5 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 transition-colors cursor-pointer flex items-center gap-1 text-[11.5px] font-bold border border-red-200 shadow-2xs"
                          >
                            <Trash2 size={13} />
                            <span>Xóa</span>
                          </button>

                          {/* Dropdown 3 chấm chuyển nhanh trạng thái */}
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuOpenId(
                                actionMenuOpenId === item.id ? null : item.id
                              )
                            }
                            title="Chuyển trạng thái kho"
                            className="p-1.5 rounded-xl hover:bg-[#F3E7E3] hover:text-[#733F49] transition-colors cursor-pointer border-0 bg-transparent"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Action Popover Menu */}
                          {actionMenuOpenId === item.id && (
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-xl border border-[#EFE5E1] py-2 z-30 text-left animate-fadeIn">
                              <div className="px-3.5 py-1 text-[10px] font-bold text-[#8C7A7B] uppercase tracking-wider bg-[#FCF8F5] mb-1">
                                TRẠNG THÁI KHO
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemStatus(item.id, 'stored', 'CÒN HÀNG')}
                                className="w-full px-3.5 py-2 text-xs text-[#1D4ED8] hover:bg-[#EFF6FF] font-semibold block text-left transition-colors cursor-pointer border-0 bg-transparent"
                              >
                                ✨ Còn Hàng
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemStatus(item.id, 'ready', 'ĐÃ CHO THUÊ')}
                                className="w-full px-3.5 py-2 text-xs text-[#1E8347] hover:bg-[#EAF8EE] font-semibold block text-left transition-colors cursor-pointer border-0 bg-transparent"
                              >
                                ✓ Đã Cho Thuê
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemStatus(item.id, 'drying', 'ĐANG BẢO DƯỠNG')}
                                className="w-full px-3.5 py-2 text-xs text-[#C05621] hover:bg-[#FFF4E6] font-semibold block text-left transition-colors cursor-pointer border-0 bg-transparent"
                              >
                                ♨ Đang Bảo Dưỡng
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemStatus(item.id, 'out_of_stock', 'HẾT HÀNG')}
                                className="w-full px-3.5 py-2 text-xs text-[#DC2626] hover:bg-[#FEF2F2] font-semibold block text-left transition-colors cursor-pointer border-0 bg-transparent"
                              >
                                ✕ Hết Hàng
                              </button>

                              <div className="border-t border-[#F2E5E0] my-1" />
                              <button
                                type="button"
                                onClick={() => handleConfirmDeleteItem(item)}
                                className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 text-left transition-colors cursor-pointer border-0 bg-transparent"
                              >
                                <Trash2 size={13} />
                                <span>Xóa mẫu khỏi kho</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-[#F2E5E0] bg-[#FFFBF9] flex-wrap gap-3">
          <div className="text-xs text-[#7A6B6C]">
            Hiển thị{' '}
            <span className="font-bold text-[#2C2523]">
              {filteredItems.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1}
            </span>{' '}
            –{' '}
            <span className="font-bold text-[#2C2523]">
              {Math.min(activePage * PAGE_SIZE, filteredItems.length)}
            </span>{' '}
            trong tổng số <span className="font-bold text-[#2C2523]">{filteredItems.length}</span> mẫu lễ phục
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activePage === 1}
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            {pageNumbers.map((p, idx) =>
              p === '...' ? (
                <button
                  key={`ellipsis-${idx}`}
                  type="button"
                  title={idx === 0 ? 'Về các trang trước' : 'Đến các trang sau'}
                  onClick={() => {
                    if (idx === 0) setActivePage((prev) => Math.max(1, prev - 3));
                    else setActivePage((prev) => Math.min(totalPages, prev + 3));
                  }}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#8C7D7E] text-xs font-bold hover:bg-[#F5ECE8] hover:text-[#733F49] transition-colors cursor-pointer"
                >
                  ...
                </button>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActivePage(p)}
                  className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors cursor-pointer ${activePage === p
                    ? 'bg-[#733F49] text-white shadow-xs'
                    : 'bg-white border border-[#EFE5E1] shadow-2xs text-[#4A3B3D] hover:bg-[#F5ECE8]'
                    }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              disabled={activePage >= totalPages}
              onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL SỬA SẢN PHẨM & TỒN KHO (EDIT MODAL)                  */}
      {/* ========================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-jakarta">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#EFE5E1] max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E6E2]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0EC] flex items-center justify-center text-[#733F49]">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="font-playfair text-xl font-bold text-[#5F2B36] m-0">
                    Chỉnh Sửa Thông Tin &amp; Tồn Kho
                  </h3>
                  <p className="text-xs text-[#8C7D7E] m-0 mt-0.5">
                    Mã lễ phục: <strong className="font-mono text-[#733F49]">{editingItem.code}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-[#FAF2EE] text-[#7A6B6C] hover:text-[#5F2B36] flex items-center justify-center transition-colors cursor-pointer border-0"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4 text-xs">
              {/* Tên mẫu váy */}
              <div>
                <label className="block font-bold text-[#5F4E50] mb-1">
                  Tên Tác Phẩm / Mẫu Váy Cưới *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] font-medium outline-none focus:border-[#B8737D]"
                />
              </div>

              {/* Vị trí tủ & Trạng thái */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Vị Trí Tủ Lưu Trữ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Tủ A1, Tủ B2, Tủ VIP..."
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] font-medium outline-none focus:border-[#B8737D]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Cơ Chế Trạng Thái Kho
                  </label>
                  <select
                    value={editStatusType}
                    onChange={(e) => setEditStatusType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] font-medium outline-none focus:border-[#B8737D] cursor-pointer"
                  >
                    <option value="stored">Còn Hàng</option>
                    <option value="ready">Đã Cho Thuê</option>
                    <option value="drying">Đang Bảo Dưỡng</option>
                    <option value="out_of_stock">Hết Hàng</option>
                  </select>
                </div>
              </div>

              {/* Giá thuê & Tiền cọc */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Đơn Giá Thuê 1 Lễ Cưới (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    required
                    value={editRentPrice}
                    onChange={(e) => setEditRentPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#733F49] font-bold outline-none focus:border-[#B8737D]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Mức Đặt Cọc Bảo Chứng (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    required
                    value={editDepositAmount}
                    onChange={(e) => setEditDepositAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] font-bold outline-none focus:border-[#B8737D]"
                  />
                </div>
              </div>

              {/* Phân bổ tồn kho theo từng Size */}
              <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#F3DDD7] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#5F2B36] uppercase tracking-wider text-[11px]">
                    Số Lượng Tồn Kho Theo Từng Kích Cỡ Size
                  </span>
                  <span className="text-[11px] text-[#8C7D7E]">
                    Tổng: <strong>{Object.values(editSizes).reduce((a, b) => a + Number(b || 0), 0)} bộ</strong>
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-1">
                  {['XS', 'S', 'M', 'L', 'XL'].map((sz) => (
                    <div key={sz} className="text-center">
                      <span className="block text-[11px] font-bold text-[#733F49] mb-1">
                        Size {sz}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={editSizes[sz] ?? 0}
                        onChange={(e) =>
                          setEditSizes((prev) => ({
                            ...prev,
                            [sz]: Math.max(0, parseInt(e.target.value) || 0),
                          }))
                        }
                        className="w-full py-1.5 text-center font-bold text-xs rounded-lg border border-[#EFE2DC] bg-white text-[#2C2523] outline-none focus:border-[#BA7A83]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Mô tả chất liệu & bảo quản */}
              <div>
                <label className="block font-bold text-[#5F4E50] mb-1">
                  Mô Tả Kiểu Dáng &amp; Tiêu Chuẩn Bảo Quản
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ghi chú chi tiết về chất liệu ren, phom dáng corset, lưu ý bảo quản..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#F0E6E2]">
                <button
                  type="button"
                  onClick={() => {
                    const itemToDelete = editingItem;
                    setEditingItem(null);
                    handleConfirmDeleteItem(itemToDelete);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 cursor-pointer transition-colors flex items-center gap-1.5 text-xs"
                >
                  <Trash2 size={14} />
                  <span>Xóa Khỏi Kho</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-5 py-2.5 rounded-xl border border-[#EFE2DC] bg-white text-[#7A6B6C] font-bold hover:bg-[#FAF2EE] cursor-pointer transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8C4654] hover:from-[#5A2D35] hover:to-[#733F49] text-white font-bold cursor-pointer transition-all shadow-md border-0"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nhập Kho Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-jakarta">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EFE5E1] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0E6E2]">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#733F49]" />
                <h3 className="font-playfair text-xl font-bold text-[#5F2B36] m-0">
                  Nhập Kho Lễ Phục Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#9A8B8C] hover:text-[#5F333B] cursor-pointer border-0 bg-transparent"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#5F4E50] mb-1">
                  Tên Tác Phẩm / Mẫu Váy Cưới *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Juliette Royal Velvet"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Bộ Sưu Tập
                  </label>
                  <input
                    type="text"
                    value={newCollection}
                    onChange={(e) => setNewCollection(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Vị Trí Tủ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Tủ A1, Tủ B2, Tủ VIP..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Đơn Giá Thuê (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    value={newRentPrice}
                    onChange={(e) => setNewRentPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Tiền Đặt Cọc (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    value={newDepositAmount}
                    onChange={(e) => setNewDepositAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF9F6] border border-[#F3DDD7]">
                <div className="font-bold text-[#5F2B36] uppercase tracking-wider text-[11px] mb-2">
                  Tồn Kho Ban Đầu
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#733F49] font-medium mb-1">Size S (bộ)</label>
                    <input
                      type="number"
                      min="0"
                      value={newSizeS}
                      onChange={(e) => setNewSizeS(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#EFE5E1] font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[#733F49] font-medium mb-1">Size M (bộ)</label>
                    <input
                      type="number"
                      min="0"
                      value={newSizeM}
                      onChange={(e) => setNewSizeM(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#EFE5E1] font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5F4E50] mb-1">
                  Mô Tả / Đặc Điểm Chất Liệu
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Lễ phục cưới cao cấp bảo quản tiêu chuẩn vi khí hậu..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0E6E2]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-[#EFE2DC] bg-white text-[#7A6B6C] font-bold hover:bg-[#FAF2EE] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#733F49] hover:bg-[#5C3038] text-white font-bold cursor-pointer transition-colors shadow-xs border-0"
                >
                  Lưu &amp; Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Xác Nhận Xóa Mẫu Váy Khỏi Kho */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-jakarta">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-[#EFE5E1] animate-scaleUp">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="font-playfair text-[20px] font-bold text-[#2C2523] leading-tight">
                  Xác Nhận Xóa Khỏi Kho
                </h3>
                <p className="text-xs text-[#8C7D7E] mt-0.5">
                  Thao tác sẽ loại bỏ mẫu lễ phục khỏi danh mục quản lý kho
                </p>
              </div>
            </div>

            <div className="bg-[#FFF9F8] border border-[#FDE2DF] rounded-2xl p-4 mb-5 text-xs text-[#4A3B3D] space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#F7D8D4]">
                <span className="text-[#8C7D7E]">Mã váy:</span>
                <span className="font-bold text-[#733F49] font-mono">{deletingItem.code}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#F7D8D4]">
                <span className="text-[#8C7D7E]">Tên mẫu váy:</span>
                <span className="font-bold text-[#2C2523] text-right">{deletingItem.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8C7D7E]">Số lượng lưu kho:</span>
                <span className="font-bold text-[#1E8347]">{deletingItem.totalStock} bộ</span>
              </div>
              <p className="text-[11px] text-red-600 mt-2 italic">
                * Lưu ý: Mẫu váy này sẽ ngừng hiển thị trong danh mục cho thuê và quản lý tồn kho.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={deleteLoading}
                className="px-4 py-2.5 rounded-xl border border-[#D5C7C2] text-[#4A3B3D] text-xs font-bold hover:bg-[#F5ECE8] transition-colors cursor-pointer bg-white"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleteLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs border-0 flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Xác Nhận Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
