import React, { useState, useMemo, useEffect } from 'react';
import { getAllOrdersAdmin, createOrder, updateOrderStatus } from '../../services/orderService';
import { formatCurrencyVND } from '../../utils/formatCurrency';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Search,
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
  Sparkles,
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
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SignedContractModal from '../../components/common/SignedContractModal';

const DRESS_OPTIONS = [
  {
    code: 'BGW-2026',
    name: 'Elysian Rose Ballgown',
    price: 5200000,
    deposit: 15000000,
    image: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80',
    sizes: ['XS (Eo 58-62cm)', 'Size S (Eo 62-66cm)', 'Size M (Eo 66-70cm)', 'Size L (Eo 70-74cm)']
  },
  {
    code: 'BESPOKE-2026',
    name: 'Bespoke Atelier Tailoring Gown',
    price: 18500000,
    deposit: 30000000,
    image: 'https://images.unsplash.com/photo-1546804784-896d0dca3800?auto=format&fit=crop&w=600&q=80',
    sizes: ['May đo cá nhân hóa 1:1']
  },
  {
    code: 'MER-2026',
    name: 'Celeste Royal Mermaid',
    price: 6500000,
    deposit: 18000000,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    sizes: ['Size S (Eo 62-66cm)', 'Size M (Eo 68-72cm)']
  },
  {
    code: 'ALINE-2026',
    name: 'Lumière Minimalist Silk A-Line',
    price: 3800000,
    deposit: 10000000,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
    sizes: ['Size XS (Eo 60-64cm)', 'Size S (Eo 64-68cm)', 'Size M (Eo 68-72cm)']
  },
  {
    code: 'MONET-2026',
    name: 'Monet 3D Floral Couture Gown',
    price: 7200000,
    deposit: 20000000,
    image: 'https://images.unsplash.com/photo-1549416878-b9ca35c2d47b?auto=format&fit=crop&w=600&q=80',
    sizes: ['Size S (Eo 64-68cm)', 'Size M (Eo 68-72cm)', 'Size L (Eo 74-78cm)']
  }
];

const fmtVnd = (num) => formatCurrencyVND(num);

export default function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBySigned, setSortBySigned] = useState('desc'); // 'desc': mới nhất -> cũ nhất, 'asc': cũ nhất -> mới nhất
  const [selectedContract, setSelectedContract] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(false);

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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Đồng bộ hợp đồng từ backend orders
  const loadContractsFromOrders = async () => {
    setLoading(true);
    try {
      const res = await getAllOrdersAdmin();
      const orderList = res?.orders || [];
      if (orderList.length > 0) {
        const liveContracts = orderList.map((ord) => {
          const item = ord.items?.[0] || {};
          let status = 'active';
          if (ord.status === 'completed') status = 'completed';
          else if (ord.status === 'cancelled') status = 'disputed';
          else if (ord.status === 'pending_payment') status = 'pending_signature';

          return {
            id: ord.contractCode || (`HD-${ord.orderCode || (ord._id ? String(ord._id).slice(-6).toUpperCase() : '001')}`),
            orderCode: ord.orderCode,
            orderId: ord._id || ord.id,
            customerId: ord.customerId,
            hasAccount: Boolean(ord.customerId || ord.hasAccount),
            customerName: ord.customerName || ord.brideName || ord.userId?.fullName || 'Khách hàng',
            phone: ord.customerPhone || ord.phone || ord.userId?.phone || '—',
            idCard: ord.customerCccd || ord.cccd || ord.idCard || '001198012345',
            dressName: item.name || item.dressId?.name || 'Váy cưới Haute Couture',
            dressCode: item.dressCode || item.dressId?.code || 'BGW-2026',
            dressSize: item.size ? `Size ${item.size}` : 'Size S',
            dressImage: item.image || item.dressId?.image || DRESS_OPTIONS[0].image,
            templateName: ord.contract?.templateName || 'Hợp đồng Thuê Váy Cưới Haute Couture Tiêu Chuẩn',
            startDate: ord.rentalStartDate ? new Date(ord.rentalStartDate).toISOString().split('T')[0] : '2026-11-01',
            endDate: ord.rentalEndDate ? new Date(ord.rentalEndDate).toISOString().split('T')[0] : '2026-11-04',
            rentalPrice: ord.totalRentPrice || 5200000,
            depositAmount: ord.totalDeposit || 15000000,
            totalValue: (ord.totalRentPrice || 5200000) + (ord.totalDeposit || 15000000),
            status,
            signedAt: ord.contract?.signedAt
              ? new Date(ord.contract.signedAt).toLocaleString('vi-VN')
              : ord.createdAt
              ? new Date(ord.createdAt).toLocaleString('vi-VN')
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
    showToast(`Đã gửi tin nhắn SMS & Email nhắc ký hợp đồng đến ${contract.customerName} (${contract.phone})`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Cập nhật trạng thái hợp đồng (Kích hoạt, Thanh lý, Giữ cọc)
  const handleUpdateStatus = async (contractId, newStatus) => {
    const updated = contracts.map((c) => {
      if (c.id === contractId) {
        const signedAt = newStatus === 'active' && !c.signedAt
          ? new Date().toLocaleString('vi-VN')
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
        signedAt: newStatus === 'active' && !prev.signedAt ? new Date().toLocaleString('vi-VN') : prev.signedAt
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
      completed: 'Hợp đồng đã hoàn thành & giải ngân hoàn cọc cho khách hàng!',
      disputed: 'Đã chuyển hợp đồng sang trạng thái đối soát bồi thường cọc!'
    };
    showToast(labels[newStatus] || 'Đã cập nhật trạng thái hợp đồng thành công!');
  };

  // Xử lý tạo hợp đồng mới tại showroom
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newPhone.trim()) {
      showToast('Vui lòng nhập họ tên và số điện thoại khách hàng.');
      return;
    }

    const dress = DRESS_OPTIONS.find((d) => d.code === selectedDressCode) || DRESS_OPTIONS[0];
    const newCode = `HD-UB-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    const orderCode = `UB-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newContractObj = {
      id: newCode,
      orderCode,
      customerName: newCustomerName.trim(),
      phone: newPhone.trim(),
      idCard: newIdCard.trim() || '00119900' + Math.floor(1000 + Math.random() * 9000),
      dressName: dress.name,
      dressCode: dress.code,
      dressSize: selectedDressSize,
      dressImage: dress.image,
      templateName: newTemplate,
      startDate: newStartDate,
      endDate: newEndDate,
      rentalPrice: dress.price,
      depositAmount: dress.deposit,
      totalValue: dress.price + dress.deposit,
      status: 'active',
      signedAt: new Date().toLocaleString('vi-VN'),
      signedMethod: 'Ký trực tiếp tại Showroom',
      staffInCharge: 'Chuyên Viên Atelier',
      packageType: 'Gói Thuê Lễ Phục Tiêu Chuẩn',
      note: newNote || 'Lập hợp đồng trực tiếp tại quầy tiếp đón.'
    };

    // Thử gửi tạo đơn qua API
    try {
      await createOrder({
        customerName: newContractObj.customerName,
        customerPhone: newContractObj.phone,
        rentalStartDate: newContractObj.startDate,
        rentalEndDate: newContractObj.endDate,
        items: [{
          name: dress.name,
          dressCode: dress.code,
          size: selectedDressSize,
          rentPrice: dress.price,
          depositPrice: dress.deposit
        }],
        totalRentPrice: dress.price,
        totalDeposit: dress.deposit,
        contractCode: newCode,
        contractSignature: newContractObj.customerName,
        status: 'active'
      });
    } catch { }

    const updatedList = [newContractObj, ...contracts];
    setContracts(updatedList);
    try { localStorage.setItem('unibridal_contracts_local', JSON.stringify(updatedList)); } catch { }

    setIsCreateOpen(false);
    setNewCustomerName('');
    setNewPhone('');
    setNewIdCard('');
    setNewNote('');
    showToast(`Đã lập thành công hợp đồng ${newCode} cho cô dâu ${newContractObj.customerName}!`);
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
            <Sparkles size={16} className="text-amber-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EFE5E1] pb-5">
          <div>

            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#302626]">
              Quản Lý Hợp Đồng Thuê Váy Cưới
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6A6B] mt-0.5">
              Theo dõi tình trạng ký kết điện tử, giá trị đặt cọc và hiệu lực pháp lý của hợp đồng thuê.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadContractsFromOrders}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#D9C4BD] bg-white text-[#733F49] hover:bg-[#FDF9F8] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Làm mới danh sách từ hệ thống đơn hàng"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
            </button>

            <Link
              to="/admin/mau-hop-dong"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#D9C4BD] bg-white text-[#733F49] hover:bg-[#FDF9F8] text-xs font-semibold shadow-xs transition-colors"
            >
              <Layers size={16} />
              <span>Mẫu Hợp Đồng</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5C323A] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
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
            <div className="text-[11px] text-emerald-600 mt-1">Đã giải ngân &amp; hoàn tất cọc</div>
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
                  <th className="py-3.5 px-4">Thời Gian Thuê</th>
                  <th className="py-3.5 px-4">Tiền Thuê &amp; Cọc</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer select-none hover:text-[#733F49] transition-colors"
                    onClick={() => setSortBySigned((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    title="Nhấp để sắp xếp theo thời gian ký"
                  >
                    <div className="flex items-center gap-1.5">
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
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6EEEB]">
                {filteredContracts.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FCFAF8] transition-colors group">
                    <td className="py-4 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="font-mono font-bold text-[#733F49] hover:underline hover:text-[#5F333B] text-xs text-left cursor-pointer p-0 bg-transparent border-0 flex items-center gap-1.5 group/btn"
                        title="Xem hợp đồng đã ký kèm chữ ký điện tử hai bên"
                      >
                        <FileSignature size={13} className="text-[#C5A880] group-hover/btn:scale-110 transition-transform shrink-0" />
                        <span>{item.id}</span>
                      </button>
                      {item.orderCode && (
                        <div className="text-[10.5px] text-[#847374] font-mono mt-0.5">
                          Đơn: <span className="font-semibold text-[#5F333B]">{item.orderCode}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[#302626]">{item.customerName}</span>
                        {item.hasAccount || item.customerId ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#FAF0EC] text-[#733F49] border border-[#F2D8D4] shrink-0"
                            title="Khách hàng thành viên có tài khoản UniBridal"
                          >
                            <UserCheck size={10} className="text-[#B8737D]" />
                            <span>Thành Viên</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-[#F5F2F0] text-[#7A6A6B] border border-[#E8DFDC] shrink-0"
                            title="Khách vãng lai thuê trực tiếp (Chưa có tài khoản)"
                          >
                            <UserX size={10} className="text-[#A39192]" />
                            <span>Khách Vãng Lai</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#7A6A6B] flex items-center gap-1.5 mt-0.5">
                        <Phone size={11} className="text-[#A39192]" />
                        <span>{item.phone}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="min-w-0">
                        <div className="font-semibold text-[#302626]">
                          {item.dressName}
                        </div>
                        <div className="text-xs text-[#A39192] mt-0.5">
                          {item.dressCode} · <span className="text-[#87565C] font-medium">{item.dressSize}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs font-semibold text-[#302626]">
                        {item.startDate} <span className="text-[#A39192]">→</span> {item.endDate}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] text-[#A39192]">
                        {item.packageType}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs font-bold text-[#87565C]">
                        Thuê: {fmtVnd(item.rentalPrice)}
                      </div>
                      <div className="text-[11px] text-[#7A6A6B] mt-0.5">
                        Cọc: <span className="font-semibold">{fmtVnd(item.depositAmount)}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {getStatusBadge(item.status)}
                      {item.signedAt ? (
                        <div className="text-[10px] text-[#A39192] mt-1 flex items-center gap-1">
                          <ShieldCheck size={11} className="text-emerald-600" />
                          <span>Ký: {item.signedAt}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                          <Clock size={11} />
                          <span>{item.signedMethod}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF0EC] text-[#733F49] hover:bg-[#F3E2DB] border border-[#ECD9D3] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          title="Xem hợp đồng đã ký kèm chữ ký điện tử hai bên"
                        >
                          <Eye size={14} />
                          <span>Xem Hợp Đồng Đã Ký</span>
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
        </div>

        {/* MODAL LẬP HỢP ĐỒNG SHOWROOM MỚI */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden my-6">
              <div className="px-6 py-4 bg-[#FAF5F2] border-b border-[#EFE5E1] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#733F49] text-white flex items-center justify-center font-bold">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#302626]">
                      Lập Hợp Đồng Thuê Váy Cưới Tại Showroom
                    </h3>
                    <p className="text-xs text-[#7A6A6B]">
                      Dành cho khách hàng thử váy và đặt thuê trực tiếp tại Atelier Suite.
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
                    <select
                      value={newTemplate}
                      onChange={(e) => setNewTemplate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-[#EFE5E1] text-sm text-[#302626] focus:outline-none focus:ring-2 focus:ring-[#B8737D]/30 bg-white"
                    >
                      <option value="Hợp đồng Thuê Váy Cưới Haute Couture Tiêu Chuẩn">Haute Couture Tiêu Chuẩn (Gói 3N)</option>
                      <option value="Hợp đồng Đặt May Đo Độc Bản & Thuê Nước Đầu">May Đo Độc Bản Bespoke Nước Đầu</option>
                      <option value="Hợp đồng Thuê Lễ Phục VIP Tiệc Tối & Chụp Ảnh">VIP Tiệc Tối & Studio Ngoại Cảnh</option>
                    </select>
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
                    className="px-4 py-2.5 rounded-xl border border-[#D9C4BD] text-xs font-semibold text-[#733F49] hover:bg-[#FDF9F8] cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#733F49] hover:bg-[#5C323A] text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Ký &amp; Kích Hoạt Hợp Đồng Ngay
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
            onClose={() => {
              setIsPreviewOpen(false);
              setSelectedContract(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
