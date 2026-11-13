import React, { useState, useMemo, useEffect } from 'react';
import { getAllOrdersAdmin, createOrder, updateOrderStatus } from '../../services/orderService';
import { formatCurrencyVND } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/formatDate';
import AdminLayout from '../../components/layout/AdminLayout';
import { Search,
  FileSignature,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  X,
  Printer,
  ShieldCheck,
  Send,
  User,
  Phone,
  CreditCard,
  Layers,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Check,
  AlertTriangle,
  UserCheck,
  UserX,
  Crown,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SignedContractModal from '../../components/common/SignedContractModal';
import { getContractTemplates } from '../../services/contractService';
import { HIEU_SIGNATURE_BASE64 } from '../../assets/images/signatureHieuBase64';
import { DRESS_CATALOG } from '../../data/dressCatalog';

const DRESS_OPTIONS = Array.isArray(DRESS_CATALOG) && DRESS_CATALOG.length > 0
  ? DRESS_CATALOG.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      price: d.priceNumber || 5000000,
      deposit: typeof d.depositAmount === 'string'
        ? parseInt(d.depositAmount.replace(/\D/g, ''), 10) || 15000000
        : (d.depositAmount || 15000000),
      image: d.image || d.images?.[0] || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80',
      sizes: (d.sizes && d.sizes.length > 0)
        ? d.sizes.map((s) => (String(s).startsWith('Size') ? s : `Size ${s}`))
        : ['Size S', 'Size M', 'Size L']
    }))
  : [
      {
        id: '6aeb1d4f4880130a58dcff21',
        code: 'UB-001',
        name: 'Elysian Rose Ballgown',
        price: 5200000,
        deposit: 15000000,
        image: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80',
        sizes: ['Size XS', 'Size S', 'Size M', 'Size L']
      }
    ];

const fmtVnd = (num) => formatCurrencyVND(num);
const PAGE_SIZE = 5;

const getRentalDays = (start, end) => {
  if (!start || !end) return 3;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
};

// Định dạng thời gian và ngày ký với 2 khoảng trắng phân tách rõ ràng
const formatSignedDateTime = (dateVal) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const timeStr = d.toLocaleTimeString('vi-VN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dateStr = d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return `${timeStr}\u00A0\u00A0${dateStr}`;
    }
  } catch {}

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]}\u00A0\u00A0${parts[1]}`;
    }
    return trimmed;
  }
  return '—';
};

export default function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBySigned, setSortBySigned] = useState('desc'); // 'desc': mới nhất -> cũ nhất, 'asc': cũ nhất -> mới nhất
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const DEFAULT_HAUTE_COUTURE_TEMPLATE = {
    code: 'TPL-HC-01',
    name: 'Hợp Đồng Thuê Lễ Phục Cưới Cao Cấp (Haute Couture)',
    clauses: [
      {
        title: 'ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG VÀ TIÊU CHUẨN LỄ PHỤC CƯỚI',
        content: '1.1. Bên A đồng ý cho Bên B thuê tác phẩm váy cưới độc bản thiết kế mang tên theo thông tin đơn thuê chi tiết, kích cỡ may đo chuẩn mực theo yêu cầu của Bên B.\n1.2. Tiêu chuẩn bàn giao: Tác phẩm đạt chuẩn Haute Couture, khung xương nẹp corset siết eo công nghệ Pháp, được giặt sấy tiệt trùng sinh học, ủi phẳng phiu và đặt trong Vali VIP Courier bảo quản chống bụi nhiệt trước giờ trao nhận 02 giờ.\n1.3. Tinh chỉnh may đo: Bên A cung cấp dịch vụ tinh chỉnh nới/siết phom theo đúng thông số số đo chuẩn (Chiều cao, Cân nặng, Vòng eo) đã được ghi nhận của Bên B.'
      },
      {
        title: 'ĐIỀU 2: THỜI HẠN THUÊ, PHƯƠNG THỨC GIAO NHẬN VÀ QUY TRÌNH THU HỒI',
        content: '2.1. Tổng thời gian thuê: Được xác định theo gói ngày Bên B lựa chọn ghi rõ trên đơn thuê.\n2.2. Thời điểm nhận váy: Từ 09:00 ngày bắt đầu thuê tại Showroom UniBridal hoặc bàn giao tận nơi bằng Vali VIP Courier.\n2.3. Phương thức hoàn trả và thu hồi: Trước 20:00 ngày kết thúc thời hạn thuê. Chuyên viên của Bên A chủ động liên hệ hẹn giờ và trực tiếp đến tận địa chỉ của Bên B thu hồi lễ phục trong vali bảo quản niêm phong, thực hiện kiểm định sơ bộ hiện trạng sản phẩm.\n2.4. Hai bên thực hiện ký Biên bản kiểm định bàn giao và thu hồi để ghi nhận hiện trạng đính kết ren, hạt cườm và kết cấu váy tại thời điểm giao và nhận lại.'
      },
      {
        title: 'ĐIỀU 3: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN',
        content: '3.1. Tổng giá trị hợp đồng thuê trọn gói đã bao gồm VAT, dịch vụ giặt hấp khử khuẩn và phí tinh chỉnh phom váy.\n3.2. Tiền đặt cọc giữ lịch độc quyền (50% giá trị hợp đồng): Bên B thanh toán ngay khi ký hợp đồng thông qua cổng chuyển khoản VietQR Napas 24/7 hoặc thẻ ngân hàng.\n3.3. Số tiền thuê còn lại sẽ được Bên B thanh toán dứt điểm tại thời điểm nhận bàn giao lễ phục.'
      },
      {
        title: 'ĐIỀU 4: TIỀN ĐẶT CỌC BẢO LÃNH VÀ CƠ CHẾ HOÀN CỌC',
        content: '4.1. Tiền đặt cọc bảo lãnh trách nhiệm được Bên B nộp để đảm bảo giữ gìn trang phục cưới nguyên trạng.\n4.2. Số tiền cọc sẽ được hoàn trả 100% cho Bên B trong vòng 02 giờ làm việc qua hình thức chuyển khoản trực tiếp sau khi hoàn tất Biên bản kiểm định thu hồi hiện trạng không phát sinh hư hỏng cấu trúc.\n4.3. Trường hợp phát sinh vết bẩn nhẹ thông thường tẩy được bằng giặt hấp sinh học, Bên A cam kết MIỄN PHÍ và không trừ tiền cọc.'
      },
      {
        title: 'ĐIỀU 5: TRÁCH NHIỆM BẢO QUẢN VÀ BẢNG GIÁ ĐỀN BÙ THIỆT HẠI NIÊM YẾT',
        content: '5.1. Bên B cam kết giữ gìn trang phục cẩn trọng, không tự ý cắt may, ủi nhiệt độ cao hoặc tẩy hóa chất.\n5.2. Hai bên thống nhất áp dụng Bảng giá đền bù thiệt hại cố định niêm yết (Phụ lục 1) để đối chiếu khi hoàn trả lễ phục, không phụ thuộc ý chí chủ quan của nhân viên:\n   • Nhóm 1 (Hao mòn tự nhiên): 0 VNĐ (Miễn phí trong gói giặt);\n   • Nhóm 2 (Vết bẩn nhẹ - son môi, phấn trang điểm): 250.000 VNĐ;\n   • Nhóm 3 (Sút chỉ / Tuột cúc - đứt chỉ viền, bung cườm): 200.000 VNĐ;\n   • Nhóm 4 (Vết bẩn cứng đầu - rượu vang, dầu mỡ sậm màu): 500.000 VNĐ;\n   • Nhóm 5 (Rách gấu ren nhỏ < 5cm do giẫm gót): 500.000 VNĐ;\n   • Nhóm 6 (Hỏng khóa lưng - zipper): 300.000 VNĐ;\n   • Nhóm 7 (Rách tùng voan lớn > 10cm, rách vải chính): 1.500.000 VNĐ;\n   • Nhóm 8 (Mất phụ kiện đi kèm): 500.000 VNĐ / món;\n   • Nhóm 9 (Hỏng hoàn toàn - cháy vải, rách nát không thể phục hồi): Tịch thu 100% tiền cọc bảo lãnh.\n5.3. Chi phí đền bù (nếu có) được khấu trừ trực tiếp vào quỹ cọc bảo lãnh. Số tiền cọc còn lại được Bên A hoàn trả đầy đủ vào STK ngân hàng của Bên B.'
      },
      {
        title: 'ĐIỀU 6: HIỆU LỰC HỢP ĐỒNG ĐIỆN TỬ',
        content: '6.1. Hợp đồng điện tử này được khởi tạo và ký kết trực tuyến hợp pháp, có giá trị pháp lý ràng buộc tương đương văn bản ký tay theo Luật Giao dịch điện tử Việt Nam.\n6.2. Hợp đồng có hiệu lực kể từ thời điểm Bên B ký điện tử và thanh toán cọc thành công cho đến khi hai bên hoàn tất biên bản bàn giao, thu hồi và thanh quyết toán cọc.'
      }
    ]
  };

  const [activeTemplate, setActiveTemplate] = useState(DEFAULT_HAUTE_COUTURE_TEMPLATE);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getContractTemplates()
      .then((res) => {
        const list = res?.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        const def = list.find((t) => t.isDefault) || list[0] || DEFAULT_HAUTE_COUTURE_TEMPLATE;
        setActiveTemplate(def);
      })
      .catch((err) => {
        console.warn('Lỗi tải mẫu hợp đồng:', err);
        setActiveTemplate(DEFAULT_HAUTE_COUTURE_TEMPLATE);
      });
  }, []);

  // Đảm bảo thanh cuộn trang web nền luôn hoạt động bình thường
  useEffect(() => {
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Form tạo hợp đồng mới tại showroom
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIdCard, setNewIdCard] = useState('');
  const [selectedDressCode, setSelectedDressCode] = useState(DRESS_OPTIONS[0].code);
  const [selectedDressSize, setSelectedDressSize] = useState(DRESS_OPTIONS[0].sizes[0]);
  const [newStartDate, setNewStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [newEndDate, setNewEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [newNote, setNewNote] = useState('');
  const [newTemplate, setNewTemplate] = useState('Hợp đồng Thuê Váy Cưới Haute Couture Tiêu Chuẩn');
  const [newInitialStatus, setNewInitialStatus] = useState('deposit_paid');
  const [creating, setCreating] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Đồng bộ hợp đồng từ backend orders
  const loadContractsFromOrders = async () => {
    setLoading(true);
    try {
      const res = await getAllOrdersAdmin({ limit: 1000 });
      const orderList = res?.orders || [];
      if (orderList.length > 0) {
        const liveContracts = orderList.map((ord) => {
          const item = ord.items?.[0] || {};
          let status = 'active';
          if (ord.status === 'completed' || ord.status === 'complete') {
            status = 'completed';
          } else if (ord.status === 'returned') {
            status = 'disputed'; // Đang xử lý cọc sau khi nhận trả váy
          } else if (ord.status === 'pending_payment') {
            status = 'pending_signature'; // Chờ ký & cọc
          } else if (ord.status === 'cancelled') {
            status = 'disputed';
          } else {
            status = 'active'; // Có hiệu lực (deposit_paid, preparing, delivering, delivered, renting)
          }

          let dressName = item.name || item.dressId?.name;
          if (!dressName || dressName.trim().length <= 1) {
            const match = ord.notes?.match(/mẫu\s+(.*?)\s+phục vụ/i);
            dressName = match ? match[1].trim() : 'Váy cưới Haute Couture Tiêu Chuẩn';
          }

          const addr = ord.shippingAddress;
          let shippingAddress = 'Nhận trực tiếp tại Showroom UniBridal (186 Nam Kỳ Khởi Nghĩa, Q.3, TP.HCM)';
          if (typeof addr === 'string' && addr.trim()) {
            shippingAddress = addr.trim();
          } else if (addr && typeof addr === 'object') {
            const parts = ['street', 'ward', 'district', 'city'].map((k) => addr[k]).filter(Boolean);
            if (parts.length > 0) shippingAddress = parts.join(', ');
          }

          const rentalPrice = Number(ord.totalRentPrice || 0);
          const depositAmount = Number(ord.totalDeposit || 0);

          return {
            id: ord.contractCode || ord.contract?.contractCode || (`HD-${ord.orderCode || (ord._id ? String(ord._id).slice(-6).toUpperCase() : '001')}`),
            orderCode: ord.orderCode || (ord._id ? String(ord._id).slice(-6).toUpperCase() : ''),
            orderId: ord._id || ord.id,
            customerId: ord.customerId,
            hasAccount: Boolean(ord.customerId || ord.hasAccount || ord.userId),
            customerName: ord.customerName || ord.brideName || ord.userId?.fullName || 'Khách hàng',
            phone: ord.customerPhone || ord.phone || ord.userId?.phone || '—',
            idCard: ord.customerCccd || ord.cccd || ord.idCard || ord.contract?.idCard || '001198012345',
            shippingAddress,
            dressName,
            dressCode: item.dressCode || item.code || item.dressId?.code || 'UB-HC-2026',
            dressSize: item.size ? (String(item.size).startsWith('Size') ? item.size : `Size ${item.size}`) : 'Size S',
            dressImage: item.image || item.dressId?.image || DRESS_OPTIONS[0].image,
            templateName: ord.contract?.templateName || 'Hợp Đồng Thuê Lễ Phục Cưới Cao Cấp (Haute Couture)',
            startDate: ord.rentalStartDate ? new Date(ord.rentalStartDate).toISOString().split('T')[0] : '2026-11-01',
            endDate: ord.rentalEndDate ? new Date(ord.rentalEndDate).toISOString().split('T')[0] : '2026-11-04',
            rentalDays: ord.rentalDays || getRentalDays(ord.rentalStartDate, ord.rentalEndDate),
            rentalPrice,
            depositAmount,
            totalValue: rentalPrice + depositAmount,
            status,
            signedAt: ord.contract?.signedAt
              ? formatSignedDateTime(ord.contract.signedAt)
              : ord.createdAt
              ? formatSignedDateTime(ord.createdAt)
              : '—',
            rawSignedAt: ord.contract?.signedAt || ord.createdAt || null,
            signedAtTime: ord.contract?.signedAt
              ? new Date(ord.contract.signedAt).getTime()
              : ord.createdAt
              ? new Date(ord.createdAt).getTime()
              : 0,
            signedMethod: ord.contractSignature ? 'Chữ ký điện tử UniBridal' : 'Ký số điện tử',
            contractSignature: ord.contractSignature || ord.customerName || ord.brideName || '',
            rawOrder: ord,
            staffInCharge: 'Chuyên viên Atelier',
            packageType: 'Gói Thuê Lễ Phục Tiêu Chuẩn',
            note: ord.notes || 'Hợp đồng điện tử kèm biên nhận cọc bảo lãnh.'
          };
        });

        // Ưu tiên hiển thị danh sách hợp đồng thực tế từ đơn hàng hệ thống
        setContracts(liveContracts);
        setError('');
      } else {
        setContracts([]);
      }
    } catch (err) {
      setError('Lỗi kết nối cơ sở dữ liệu: Không thể tải danh sách hợp đồng từ hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractsFromOrders();
  }, []);

  const filteredContracts = useMemo(() => {
    const list = contracts.filter((item) => {
      const matchSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm) ||
        item.dressName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchSearch && matchStatus;
    });

    return list.sort((a, b) => {
      const timeA = a.signedAtTime || (a.rawSignedAt ? new Date(a.rawSignedAt).getTime() : 0);
      const timeB = b.signedAtTime || (b.rawSignedAt ? new Date(b.rawSignedAt).getTime() : 0);
      return sortBySigned === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [contracts, searchTerm, selectedStatus, sortBySigned]);

  // Tự động về trang 1 khi lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus, sortBySigned]);

  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / PAGE_SIZE));

  const paginatedContracts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredContracts.slice(start, start + PAGE_SIZE);
  }, [filteredContracts, currentPage]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage < 3) {
      return [1, 2, 3, '...', totalPages - 1, totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return ['...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    if (currentPage + 2 >= totalPages - 1) {
      return ['...', currentPage - 1, currentPage, currentPage + 1, totalPages - 1, totalPages];
    }
    return ['...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages - 1, totalPages];
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      total: contracts.length,
      active: contracts.filter((c) => c.status === 'active').length,
      pending: contracts.filter((c) => c.status === 'pending_signature').length,
      completed: contracts.filter((c) => c.status === 'completed').length,
      disputed: contracts.filter((c) => c.status === 'disputed').length,
      totalDeposit: contracts.reduce((sum, c) => sum + (c.status === 'active' ? c.depositAmount : 0), 0)
    };
  }, [contracts]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} /> Có Hiệu Lực
          </span>
        );
      case 'pending_signature':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={13} /> Chờ Ký
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3ECE8] text-[#705856] border border-[#E8DDD8]">
            <CheckCircle2 size={13} /> Đã Hoàn Thành
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={13} /> Đang Xử Lý Cọc
          </span>
        );
      default:
        return null;
    }
  };

  const handleOpenPreview = (contract) => {
    setSelectedContract(contract);
    setIsPreviewOpen(true);
  };

  const handleSendReminder = (contract) => {
    showToast(`Đã gửi tin nhắn SMS VÀ Email nhắc ký hợp đồng đến ${contract.customerName} (${contract.phone})`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Cập nhật trạng thái hợp đồng (Kích hoạt, Thanh lý, Giữ cọc)
  const handleUpdateStatus = async (contractId, newStatus) => {
    const updated = contracts.map((c) => {
      if (c.id === contractId) {
        const signedAt = newStatus === 'active' && !c.signedAt
          ? formatSignedDateTime(new Date())
          : c.signedAt;
        const rawSignedAt = newStatus === 'active' && !c.rawSignedAt
          ? new Date().toISOString()
          : c.rawSignedAt;
        const signedAtTime = rawSignedAt ? new Date(rawSignedAt).getTime() : c.signedAtTime;
        return { ...c, status: newStatus, signedAt, rawSignedAt, signedAtTime };
      }
      return c;
    });

    setContracts(updated);
    try { localStorage.setItem('unibridal_contracts_local', JSON.stringify(updated)); } catch { }

    if (selectedContract && selectedContract.id === contractId) {
      setSelectedContract((prev) => ({
        ...prev,
        status: newStatus,
        signedAt: newStatus === 'active' && !prev.signedAt ? formatSignedDateTime(new Date()) : prev.signedAt
      }));
    }

    const target = contracts.find((c) => c.id === contractId);
    if (target?.orderId) {
      try {
        let orderBackendStatus = 'active';
        if (newStatus === 'completed') orderBackendStatus = 'completed';
        if (newStatus === 'disputed') orderBackendStatus = 'returned';
        await updateOrderStatus(target.orderId, orderBackendStatus);
      } catch { }
    }

    const labels = {
      active: 'Đã kích hoạt hợp đồng có hiệu lực pháp lý!',
      completed: 'Hợp đồng đã hoàn thành và giải ngân hoàn cọc cho khách hàng!',
      disputed: 'Đã chuyển hợp đồng sang trạng thái đối soát bồi thường cọc!'
    };
    showToast(labels[newStatus] || 'Đã cập nhật trạng thái hợp đồng thành công!');
  };

  // Xử lý tạo hợp đồng mới tại showroom -> BẮT BUỘC tạo đơn thuê đi kèm trong hệ thống
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newPhone.trim()) {
      showToast('Vui lòng nhập họ tên và số điện thoại khách hàng.');
      return;
    }

    setCreating(true);
    try {
      const dress = DRESS_OPTIONS.find((d) => d.code === selectedDressCode) || DRESS_OPTIONS[0];
      const newCode = `HD-UB-2026-${String(Math.floor(100 + Math.random() * 900))}`;

      // BẮT BUỘC: Khi tạo hợp đồng mới phải tạo Đơn Thuê mới tương ứng đi kèm trong hệ thống
      const orderPayload = {
        customerName: newCustomerName.trim(),
        brideName: newCustomerName.trim(),
        customerPhone: newPhone.trim(),
        phone: newPhone.trim(),
        customerCccd: newIdCard.trim() || undefined,
        cccd: newIdCard.trim() || undefined,
        rentalStartDate: newStartDate,
        rentalEndDate: newEndDate,
        rentalDays: getRentalDays(newStartDate, newEndDate),
        items: [
          {
            dressId: dress.id,
            code: dress.code,
            name: dress.name,
            size: selectedDressSize.replace(/^Size\s*/i, ''),
            rentPrice: dress.price,
            depositAmount: dress.deposit,
            image: dress.image,
          },
        ],
        totalRentPrice: dress.price,
        totalDeposit: dress.deposit,
        totalPayment: dress.price + dress.deposit,
        contractCode: newCode,
        contractSignature: newCustomerName.trim(),
        deliveryMethod: 'showroom',
        shippingAddress: 'Showroom UniBridal (Lập hợp đồng và bàn giao trực tiếp tại quầy)',
        status: newInitialStatus || 'deposit_paid',
        notes: newNote ? `Hợp đồng Showroom: ${newNote}` : 'Lập hợp đồng và tạo đơn thuê trực tiếp tại quầy tiếp đón.',
      };

      const result = await createOrder(orderPayload);
      const createdOrder = result?.data || result;
      const orderCode = createdOrder?.orderCode || `UB-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const finalContractCode = createdOrder?.contractCode || newCode;

      // Nạp lại danh sách hợp đồng thực tế từ đơn hàng hệ thống
      await loadContractsFromOrders();

      setIsCreateOpen(false);
      setNewCustomerName('');
      setNewPhone('');
      setNewIdCard('');
      setNewNote('');
      showToast(`Đã lập thành công Hợp Đồng ${finalContractCode} và tự động tạo Đơn Thuê #${orderCode} cho cô dâu ${newCustomerName.trim()}!`);
    } catch (err) {
      console.error('Lỗi khi lập hợp đồng và đơn thuê:', err);
      showToast(err.message || 'Không thể tạo đơn và hợp đồng. Vui lòng thử lại!');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout activeMenu="contracts">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-contract-document, #printable-contract-document * {
            visibility: visible;
          }
          #printable-contract-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm 20mm;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <span className="font-semibold">⚠️ Lỗi kết nối Cơ sở dữ liệu:</span> {error}
          </div>
        )}
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#302626] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm animate-fade-in border border-amber-900/30">
            <Crown size={16} className="text-amber-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-playfair text-[32px] sm:text-[38px] font-normal text-[#5F2B36] tracking-tight leading-tight mb-2">
              Quản Lý Hợp Đồng
            </h1>
            <p className="text-[14px] text-[#7A6B6C] font-normal max-w-3xl leading-relaxed">
              Theo dõi tình trạng ký kết điện tử, giá trị đặt cọc và hiệu lực pháp lý của hợp đồng thuê váy cưới UniBridal.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={loadContractsFromOrders}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E8DDD8] bg-white text-[#5F2B36] hover:bg-[#FAF0EC] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
              title="Làm mới danh sách từ hệ thống đơn hàng"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E8DDD8] bg-white text-[#5F2B36] hover:bg-[#FAF0EC] text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Xem mẫu hợp đồng chuẩn đang áp dụng trên hệ thống"
            >
              <FileText size={14} />
              <span>Mẫu Hợp Đồng Đang Áp Dụng</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8C4654] hover:from-[#5A2D35] hover:to-[#733F49] text-white text-xs font-bold transition-all cursor-pointer shadow-md border-0"
            >
              <Plus size={16} />
              <span>Lập Hợp Đồng Showroom</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-xs">
            <span className="text-xs text-[#8A797A] font-medium block">TỔNG HỢP ĐỒNG</span>
            <div className="text-2xl font-bold text-[#302626] mt-1">{stats.total}</div>
            <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <span>{stats.active} HĐ đang hiệu lực</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-xs">
            <span className="text-xs text-[#8A797A] font-medium block">CHỜ KHÁCH KÝ</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</div>
            <div className="text-[11px] text-[#8A797A] mt-1">Cần ký trước ngày fitting / nhận váy</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-xs">
            <span className="text-xs text-[#8A797A] font-medium block">ĐÃ HOÀN THÀNH</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</div>
            <div className="text-[11px] text-emerald-600 mt-1">Đã giải ngân và hoàn tất cọc</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-xs">
            <span className="text-xs text-[#8A797A] font-medium block">QUỸ CỌC ĐANG BẢO LÃNH</span>
            <div className="text-xl lg:text-2xl font-bold text-[#87565C] mt-1">
              {fmtVnd(stats.totalDeposit)}
            </div>
            <div className="text-[11px] text-[#8A797A] mt-1">Tài khoản phong tỏa ngân hàng</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A39192]" />
            <input
              type="text"
              placeholder="Tìm mã hợp đồng, tên khách hàng, số điện thoại, váy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#EFE5E1] bg-[#FCF7F4] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30 focus:border-[#B8737D]"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap overflow-x-auto pb-1 md:pb-0">
            {/* Nút sắp xếp theo thời gian ký */}
            <button
              type="button"
              onClick={() => setSortBySigned((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF2EE] border border-[#EFE2DC] text-xs font-bold text-[#5F333B] hover:bg-[#F3E7E2] transition-colors cursor-pointer shrink-0 shadow-2xs"
              title="Nhấp để đảo chiều sắp xếp theo thời gian ký"
            >
              <ArrowUpDown size={13} className="text-[#B8737D]" />
              <span>Thời gian ký: {sortBySigned === 'desc' ? 'Mới nhất ↓' : 'Cũ nhất ↑'}</span>
            </button>

            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Có hiệu lực' },
              { id: 'pending_signature', label: 'Chờ ký' },
              { id: 'completed', label: 'Đã hoàn thành' },
              { id: 'disputed', label: 'Đang xử lý cọc' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${selectedStatus === tab.id
                    ? 'bg-[#733F49] text-white shadow-xs'
                    : 'bg-[#F9ECE8] text-[#6E5957] hover:bg-[#F2DFD9]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contract Table */}
        <div className="bg-white rounded-xl border border-[#EFE5E1] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF5F2] border-b border-[#EFE5E1] text-[11px] font-bold text-[#7A6A6B] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã Hợp Đồng</th>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Trang Phục Thuê</th>
                  <th className="py-3.5 px-4 text-center">Thời Gian Thuê</th>
                  <th className="py-3.5 px-4 text-center">Tiền Thuê</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer select-none hover:text-[#733F49] transition-colors text-center"
                    onClick={() => setSortBySigned((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    title="Nhấp để sắp xếp theo thời gian ký"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Trạng Thái</span>
                      <span className="text-[#B8737D] inline-flex items-center" title={`Sắp xếp: ${sortBySigned === 'desc' ? 'Mới nhất ↓' : 'Cũ nhất ↑'}`}>
                        {sortBySigned === 'desc' ? (
                          <ArrowDown size={13} className="text-[#733F49]" />
                        ) : (
                          <ArrowUp size={13} className="text-[#733F49]" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6EEEB]">
                {paginatedContracts.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FCFAF8] transition-colors group">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="font-mono font-bold text-[#733F49] hover:underline hover:text-[#5F333B] text-xs text-left cursor-pointer p-0 bg-transparent border-0 flex items-center gap-1.5 group/btn"
                        title="Xem chi tiết hợp đồng"
                      >
                        <FileSignature size={13} className="text-[#C5A880] group-hover/btn:scale-110 transition-transform shrink-0" />
                        <span>{item.id}</span>
                      </button>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#302626] text-[13px]">{item.customerName}</span>
                        {(item.hasAccount || item.customerId) && (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAF0EC] border border-[#E8C5BE] text-[#8C4654] shrink-0"
                            title="Khách hàng có tài khoản"
                          >
                            <User size={11} className="text-[#8C4654]" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#302626] text-[13px]">
                        {item.dressName}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <span className="text-xs font-semibold text-[#302626]" title={`${formatShortDate(item.startDate)} → ${formatShortDate(item.endDate)}`}>
                        {item.rentalDays || getRentalDays(item.startDate, item.endDate)} ngày
                      </span>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <div className="text-[13px] font-bold text-[#87565C]">
                        {fmtVnd(item.rentalPrice)}
                      </div>
                      <div className="text-[11px] text-[#7A6A6B] mt-0.5">
                        (Cọc: <span className="font-semibold">{fmtVnd(item.depositAmount)}</span>)
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center justify-center">
                        {getStatusBadge(item.status)}
                        {item.signedAt ? (
                          <div className="text-[10px] text-[#A39192] mt-1 flex items-center justify-center gap-1">
                            <ShieldCheck size={11} className="text-emerald-600 shrink-0" />
                            <span className="whitespace-pre">Ký: {formatSignedDateTime(item.rawSignedAt || item.signedAt)}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-600 mt-1 flex items-center justify-center gap-1">
                            <Clock size={11} />
                            <span>{item.signedMethod}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF0EC] text-[#733F49] hover:bg-[#F3E2DB] border border-[#ECD9D3] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          title="Xem chi tiết hợp đồng"
                        >
                          <Eye size={14} />
                          <span>Xem chi tiết</span>
                        </button>

                        {item.status === 'pending_signature' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(item.id, 'active')}
                            className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Xác nhận đã ký hợp đồng tại chỗ"
                          >
                            <CheckCircle2 size={17} />
                          </button>
                        )}

                        {item.status === 'pending_signature' && (
                          <button
                            type="button"
                            onClick={() => handleSendReminder(item)}
                            className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Gửi nhắc ký hợp đồng qua SMS/Email"
                          >
                            <Send size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredContracts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#9E8B89]">
                      <FileText size={36} className="mx-auto mb-2 text-[#CBB9B4]" />
                      <p className="text-sm font-medium">Không tìm thấy hợp đồng nào phù hợp.</p>
                      <p className="text-xs text-[#B5A5A1] mt-1">Thử thay đổi từ khóa hoặc bộ lọc trạng thái.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang: 5 hợp đồng / trang */}
          {filteredContracts.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-[#F2E5E0] bg-[#FFFBF9]">
              <div className="text-xs text-[#7A696B]">
                Hiển thị{' '}
                <span className="font-bold text-[#5F333B]">
                  {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredContracts.length)}
                </span>{' '}
                –{' '}
                <span className="font-bold text-[#5F333B]">
                  {Math.min(currentPage * PAGE_SIZE, filteredContracts.length)}
                </span>{' '}
                trong tổng số{' '}
                <span className="font-bold text-[#2C2523]">{filteredContracts.length}</span> hợp đồng
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] disabled:opacity-40 transition-colors cursor-pointer"
                  title="Trang trước"
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
                        if (idx === 0) setCurrentPage((prev) => Math.max(1, prev - 3));
                        else setCurrentPage((prev) => Math.min(totalPages, prev + 3));
                      }}
                      className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#8C7D7E] text-xs font-bold hover:bg-[#F5ECE8] hover:text-[#733F49] transition-colors cursor-pointer"
                    >
                      ...
                    </button>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer ${
                        currentPage === p
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
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] disabled:opacity-40 transition-colors cursor-pointer"
                  title="Trang tiếp theo"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL LẬP HỢP ĐỒNG SHOWROOM MỚI */}
        {isCreateOpen && (
          <div
            onClick={() => setIsCreateOpen(false)}
            className="fixed inset-0 z-50 bg-transparent flex items-center justify-center p-3 sm:p-5 overflow-y-auto cursor-pointer no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-[0_25px_70px_rgba(44,37,35,0.35)] border border-[#DFD3C8] overflow-hidden my-6 cursor-default"
            >
              <div className="px-6 py-4 bg-[#FAF5F2] border-b border-[#EFE5E1] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#733F49] text-white flex items-center justify-center font-bold">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#302626]">
                      Lập Hợp Đồng & Khởi Tạo Đơn Thuê Tại Showroom
                    </h3>
                    <p className="text-xs text-[#7A6A6B]">
                      Hệ thống tự động lập hợp đồng số và tạo mã đơn thuê đi kèm để showroom quản lý bàn giao.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 rounded-lg text-[#733F49] hover:bg-[#EFE2DE] transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                {/* Banner giải thích đồng bộ đơn hàng */}
                <div className="p-3.5 rounded-xl bg-[#FAF5F2] border border-[#EEDECF] flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#733F49] text-white flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                    ✓
                  </div>
                  <div className="text-[12px] text-[#594B49] leading-relaxed">
                    <strong className="text-[#733F49]">Đồng bộ tự động:</strong> Khi lập hợp đồng tại Showroom, hệ thống sẽ lập tức tạo <strong>01 Đơn Thuê mới tương ứng</strong> trong danh sách <em>Quản Lý Đơn Thuê</em>, đảm bảo kiểm soát xuyên suốt từ thử váy, đặt cọc đến bàn giao và kiểm định hoàn cọc.
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Họ và tên cô dâu *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Hoàng Ngọc Trâm"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ví dụ: 0938 123 456"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Số CCCD / Hộ chiếu (Bảo lãnh)
                    </label>
                    <input
                      type="text"
                      placeholder="001199008877"
                      value={newIdCard}
                      onChange={(e) => setNewIdCard(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Mẫu hợp đồng áp dụng
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={activeTemplate?.name || 'Hợp Đồng Thuê Lễ Phục Cưới Cao Cấp (Haute Couture) — Mặc Định'}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-xs font-semibold text-[#5F2B36] bg-[#FAF2EE] outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Chọn Mẫu Váy Cưới Thuê *
                    </label>
                    <select
                      value={selectedDressCode}
                      onChange={(e) => {
                        setSelectedDressCode(e.target.value);
                        const found = DRESS_OPTIONS.find((d) => d.code === e.target.value);
                        if (found) setSelectedDressSize(found.sizes[0]);
                      }}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30 bg-white"
                    >
                      {DRESS_OPTIONS.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.name} ({fmtVnd(opt.price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Kích Thước (Size)
                    </label>
                    <select
                      value={selectedDressSize}
                      onChange={(e) => setSelectedDressSize(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30 bg-white"
                    >
                      {(DRESS_OPTIONS.find((d) => d.code === selectedDressCode)?.sizes || []).map((sz) => (
                        <option key={sz} value={sz}>{sz}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Ngày nhận váy *
                    </label>
                    <input
                      type="date"
                      required
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Ngày hoàn trả váy *
                    </label>
                    <input
                      type="date"
                      required
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Trạng thái đơn thuê ban đầu *
                    </label>
                    <select
                      value={newInitialStatus}
                      onChange={(e) => setNewInitialStatus(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30 bg-white"
                    >
                      <option value="deposit_paid">Đã Đặt Cọc (Đơn đang xử lý chờ ngày bàn giao)</option>
                      <option value="renting">Đang Thuê (Khách nhận váy trực tiếp tại Showroom)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                      Phương thức nhận lễ phục
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Nhận trực tiếp tại quầy Showroom UniBridal"
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-xs font-semibold text-[#5F2B36] bg-[#FAF2EE] outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#594B49] uppercase mb-1">
                    Ghi chú điều khoản bổ sung / Phụ lục fitting
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Hạ eo 1cm, tặng kèm voan cài đầu 2.5m, hoàn cọc chuyển khoản ngay khi nhận lại váy..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-xs text-[#7A6A6B] flex items-center justify-between">
                  <div>
                    <span>Giá thuê niêm yết: <b>{fmtVnd(DRESS_OPTIONS.find((d) => d.code === selectedDressCode)?.price)}</b></span>
                    <span className="mx-2">·</span>
                    <span>Tiền cọc bảo lãnh: <b>{fmtVnd(DRESS_OPTIONS.find((d) => d.code === selectedDressCode)?.deposit)}</b></span>
                  </div>
                  <span className="text-[11px] font-bold text-[#733F49] uppercase">Ký trực tiếp tại chỗ</span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={creating}
                    className="px-4 py-2.5 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#733F49] hover:bg-[#FDF9F8] cursor-pointer disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5C323A] text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-2"
                  >
                    {creating && <RefreshCw size={14} className="animate-spin" />}
                    <span>{creating ? 'Đang Khởi Tạo Đơn & Hợp Đồng...' : 'Ký và Kích Hoạt Hợp Đồng & Tạo Đơn'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL XEM HỢP ĐỒNG ĐÃ KÝ KÈM CHỮ KÝ ĐIỆN TỬ */}
        {isPreviewOpen && selectedContract && (
          <SignedContractModal
            orderId={selectedContract.orderId || selectedContract.orderCode || selectedContract.id}
            order={selectedContract.rawOrder || selectedContract}
            contractData={selectedContract}
            onClose={() => {
              setIsPreviewOpen(false);
              setSelectedContract(null);
            }}
          />
        )}

        {/* MODAL XEM MẪU HỢP ĐỒNG ĐANG ÁP DỤNG */}
        {isTemplateModalOpen && activeTemplate && (
          <div
            onClick={() => setIsTemplateModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent animate-in fade-in duration-200 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[0_25px_70px_rgba(44,37,35,0.35)] border border-[#DFD3C8] overflow-hidden cursor-default"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#EFE5E1] flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-[#C5A880] flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#733F49]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#2C2523]">{activeTemplate.name}</h3>
                    <p className="text-xs text-[#8C7A6B]">
                      Mã mẫu: <span className="font-mono font-bold text-[#733F49]">{activeTemplate.code}</span> • Trạng thái: <span className="text-emerald-700 font-semibold">Đang áp dụng toàn hệ thống</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white border border-[#E0D5CE] text-[#8C7A6B] hover:text-[#2C2523] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto space-y-6 text-[#2C2523] font-serif bg-white no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* National Header */}
                <div className="text-center space-y-1 font-sans border-b border-[#E8DFD8] pb-6">
                  <p className="text-xs uppercase font-bold tracking-widest text-[#594B43]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="text-xs italic text-[#7C695D]">Độc lập – Tự do – Hạnh phúc</p>
                  <div className="w-24 h-0.5 bg-[#C5A880] mx-auto my-3" />
                  <h2 className="text-lg font-bold font-serif text-[#2C2523] uppercase mt-2">
                    {activeTemplate.name}
                  </h2>
                  <p className="text-xs font-mono text-[#8C7A6B]">Số: HDDT/{activeTemplate.code}/[MÃ_ĐƠN_THUÊ]</p>
                </div>

                {/* Clauses list */}
                <div className="space-y-4 font-sans text-xs">
                  {(activeTemplate.clauses || []).map((clause, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-2xs">
                      <h5 className="font-bold text-sm text-[#2C2523] mb-1.5 text-serif">{clause.title}</h5>
                      <p className="text-[#69584D] leading-relaxed text-xs whitespace-pre-line">{clause.content}</p>
                    </div>
                  ))}
                </div>

                {/* Khối chữ ký điện tử hai bên */}
                <div className="pt-6 border-t border-[#EFE5E1] grid grid-cols-2 gap-6 text-center text-xs font-sans">
                  {/* Chữ ký Bên A */}
                  <div className="p-4 rounded-2xl border border-[#EEDECF] bg-white flex flex-col items-center justify-between min-h-[190px]">
                    <div>
                      <p className="font-bold uppercase text-[#733F49] tracking-wider text-[11px]">
                        ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
                      </p>
                      <p className="text-[#847374] text-[10px] italic mt-0.5">
                        CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE
                      </p>
                    </div>

                    <div className="my-2 flex flex-col items-center">
                      <img
                        src={HIEU_SIGNATURE_BASE64}
                        alt="Chữ ký Kim Xuân Hiếu"
                        className="h-16 w-auto object-contain select-none"
                      />
                      <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[9px] font-bold inline-flex items-center gap-1">
                        <ShieldCheck size={11} /> VERIFIED BY UNIBRIDAL CA
                      </div>
                    </div>

                    <div>
                      <strong className="block text-[#2C2523] text-[12px]">Ông Kim Xuân Hiếu</strong>
                      <span className="text-[10px] text-[#847374]">Tổng Giám Đốc Atelier UniBridal</span>
                    </div>
                  </div>

                  {/* Chữ ký Bên B */}
                  <div className="p-4 rounded-2xl border border-[#EEDECF] bg-white flex flex-col items-center justify-between min-h-[190px]">
                    <div>
                      <p className="font-bold uppercase text-[#733F49] tracking-wider text-[11px]">
                        BÊN THUÊ LỄ PHỤC (BÊN B)
                      </p>
                      <p className="text-[#847374] text-[10px] italic mt-0.5">
                        XÁC NHẬN BẰNG CHỮ KÝ ĐIỆN TỬ
                      </p>
                    </div>

                    <div className="my-4 flex items-center justify-center">
                      <span className="font-serif italic text-base text-[#733F49]">
                        [Chữ ký điện tử / SmartOTP]
                      </span>
                    </div>

                    <div>
                      <strong className="block text-[#2C2523] text-[12px]">[Tên Khách Hàng]</strong>
                      <span className="text-[10px] text-[#847374]">Bên Thuê Lễ Phục</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-[#EFE5E1] flex items-center justify-between">
                <a
                  href={`http://localhost:5000/api/contract-templates/${activeTemplate.code}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#733F49] hover:bg-[#FAF0EC] bg-white rounded-xl border border-[#E8DFD8] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Mở Bản In PDF (Chuẩn A4)
                </a>
                <button
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#733F49] hover:bg-[#5C323A] rounded-xl transition-all cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
