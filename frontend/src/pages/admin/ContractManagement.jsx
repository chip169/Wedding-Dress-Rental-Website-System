import React, { useState, useMemo } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_CONTRACTS = [
  {
    id: 'HD-UB-2026-089',
    customerName: 'Nguyễn Khánh Linh',
    phone: '0912 345 678',
    idCard: '001198012345',
    dressName: 'Elysian Rose Ballgown',
    dressCode: 'BGW-2026',
    dressSize: 'Size S (Eo 62-66cm)',
    dressImage: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80',
    templateName: 'Hợp đồng Thuê Váy Cưới Haute Couture Tiêu Chuẩn',
    startDate: '2026-10-24',
    endDate: '2026-10-27',
    rentalPrice: 5200000,
    depositAmount: 15000000,
    totalValue: 20200000,
    status: 'active', // 'active' | 'pending_signature' | 'completed' | 'disputed'
    signedAt: '2026-10-20 14:30',
    signedMethod: 'SmartOTP eID',
    staffInCharge: 'Trần Bích Ngọc',
    packageType: 'Gói 3 Ngày Tiêu Chuẩn',
    note: 'Đã fitting tinh chỉnh eo giảm 1.5cm ngày 19/10.'
  },
  {
    id: 'HD-UB-2026-088',
    customerName: 'Trần Thảo My',
    phone: '0988 765 432',
    idCard: '079199009876',
    dressName: 'Bespoke Atelier Tailoring Gown',
    dressCode: 'BESPOKE-2026',
    dressSize: 'May đo cá nhân hóa',
    dressImage: 'https://images.unsplash.com/photo-1546804784-896d0dca3800?auto=format&fit=crop&w=600&q=80',
    templateName: 'Hợp đồng Đặt May Đo Độc Bản & Thuê Nước Đầu',
    startDate: '2026-11-05',
    endDate: '2026-11-10',
    rentalPrice: 18500000,
    depositAmount: 30000000,
    totalValue: 48500000,
    status: 'active',
    signedAt: '2026-10-18 11:15',
    signedMethod: 'Chữ ký điện tử VNPT CA',
    staffInCharge: 'Lê Hoàng Minh',
    packageType: 'May đo Bespoke Nước Đầu',
    note: 'Đính kết hạt pha lê Swarovski thủ công 100%.'
  },
  {
    id: 'HD-UB-2026-082',
    customerName: 'Phạm Hoàng Anh',
    phone: '0903 112 233',
    idCard: '031197004567',
    dressName: 'Celeste Royal Mermaid',
    dressCode: 'MER-2026',
    dressSize: 'Size M (Eo 68-72cm)',
    dressImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    templateName: 'Hợp đồng Thuê Váy Cưới Haute Couture Tiêu Chuẩn',
    startDate: '2026-10-28',
    endDate: '2026-10-31',
    rentalPrice: 6500000,
    depositAmount: 18000000,
    totalValue: 24500000,
    status: 'pending_signature',
    signedAt: null,
    signedMethod: 'Chờ khách hàng ký OTP',
    staffInCharge: 'Trần Bích Ngọc',
    packageType: 'Gói 3 Ngày Tiêu Chuẩn',
    note: 'Khách đã thanh toán cọc 30% giữ lịch ngày 19/10.'
  },
  {
    id: 'HD-UB-2026-076',
    customerName: 'Lê Quỳnh Như',
    phone: '0938 999 888',
    idCard: '048196001234',
    dressName: 'Heritage Gown & Royal Groom Tuxedo',
    dressCode: 'COMBO-PRE-01',
    dressSize: 'Váy M · Vest 50',
    dressImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
    templateName: 'Hợp đồng Thuê Trọn Gói Pre-Wedding & Ngày Cưới',
    startDate: '2026-10-15',
    endDate: '2026-10-18',
    rentalPrice: 12000000,
    depositAmount: 25000000,
    totalValue: 37000000,
    status: 'completed',
    signedAt: '2026-10-10 09:20',
    signedMethod: 'SmartOTP eID',
    staffInCharge: 'Nguyễn Phương Thảo',
    packageType: 'Combo Trọn Gói 2 Trang Phục',
    note: 'Đã hoàn tất bàn giao & hoàn cọc 100% ngày 18/10.'
  },
  {
    id: 'HD-UB-2026-069',
    customerName: 'Đỗ Ngọc Bích',
    phone: '0977 445 566',
    idCard: '001195007890',
    dressName: 'Juliette Floral A-Line Gown',
    dressCode: 'ALN-2026',
    dressSize: 'Size S (Eo 63-67cm)',
    dressImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80',
    templateName: 'Hợp đồng Thuê Váy Cưới Haute Couture Tiêu Chuẩn',
    startDate: '2026-10-12',
    endDate: '2026-10-15',
    rentalPrice: 5800000,
    depositAmount: 16000000,
    totalValue: 21800000,
    status: 'completed',
    signedAt: '2026-10-08 16:45',
    signedMethod: 'SmartOTP eID',
    staffInCharge: 'Trần Bích Ngọc',
    packageType: 'Gói 3 Ngày Tiêu Chuẩn',
    note: 'Hợp đồng đã thanh lý an toàn.'
  },
  {
    id: 'HD-UB-2026-061',
    customerName: 'Vũ Thanh Hương',
    phone: '0966 223 344',
    idCard: '025199003322',
    dressName: 'Monet 3D Floral Couture Gown',
    dressCode: 'MONET-2026',
    dressSize: 'Size L (Eo 74-78cm)',
    dressImage: 'https://images.unsplash.com/photo-1549416878-b9ca35c2d47b?auto=format&fit=crop&w=600&q=80',
    templateName: 'Hợp đồng Thuê Váy Cưới Haute Couture Tiêu Chuẩn',
    startDate: '2026-10-09',
    endDate: '2026-10-13',
    rentalPrice: 7200000,
    depositAmount: 20000000,
    totalValue: 27200000,
    status: 'disputed',
    signedAt: '2026-10-05 10:10',
    signedMethod: 'SmartOTP eID',
    staffInCharge: 'Lê Hoàng Minh',
    packageType: 'Gói 4 Ngày Mở Rộng',
    note: 'Trả váy trễ 1 ngày + vết bẩn rượu vang phần đuôi, đang xử lý trừ cọc 2.500.000đ.'
  }
];

const fmtVnd = (num) => `${Number(num || 0).toLocaleString('vi-VN')}₫`;

export default function ContractManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedContract, setSelectedContract] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const filteredContracts = useMemo(() => {
    return MOCK_CONTRACTS.filter((item) => {
      const matchSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm) ||
        item.dressName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [searchTerm, selectedStatus]);

  const stats = useMemo(() => {
    return {
      total: MOCK_CONTRACTS.length,
      active: MOCK_CONTRACTS.filter((c) => c.status === 'active').length,
      pending: MOCK_CONTRACTS.filter((c) => c.status === 'pending_signature').length,
      completed: MOCK_CONTRACTS.filter((c) => c.status === 'completed').length,
      disputed: MOCK_CONTRACTS.filter((c) => c.status === 'disputed').length,
      totalDeposit: MOCK_CONTRACTS.reduce((sum, c) => sum + (c.status === 'active' ? c.depositAmount : 0), 0)
    };
  }, []);

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
            <Clock size={13} /> Chờ Ký OTP
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3ECE8] text-[#705856] border border-[#E8DDD8]">
            <CheckCircle2 size={13} /> Đã Thanh Lý
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

  return (
    <AdminLayout activeMenu="contracts">
      <div className="space-y-6">
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
            <div className="flex items-center gap-2 text-xs text-[#9E8B89] mb-1">
              <span>Quản trị UniBridal</span>
              <span>/</span>
              <span className="text-[#733F49] font-medium">Hợp đồng điện tử</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-[#302626]">
              Quản Lý Hợp Đồng Thuê Váy Cưới
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6A6B] mt-0.5">
              Theo dõi tình trạng ký kết điện tử, giá trị đặt cọc và hiệu lực pháp lý của hợp đồng thuê.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/mau-hop-dong"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9C4BD] bg-white text-[#733F49] hover:bg-[#FDF9F8] text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <Layers size={16} />
              <span>Quản Lý Mẫu Hợp Đồng</span>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-xs">
            <span className="text-xs text-[#8A797A] font-medium block">TỔNG HỢP ĐỒNG</span>
            <div className="text-2xl font-bold text-[#302626] mt-1">{stats.total}</div>
            <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <span>{stats.active} HĐ đang thuê</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-xs">
            <span className="text-xs text-[#8A797A] font-medium block">CHỜ KHÁCH KÝ OTP</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</div>
            <div className="text-[11px] text-[#8A797A] mt-1">Cần nhắc nhở trước ngày fitting</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-xs">
            <span className="text-xs text-[#8A797A] font-medium block">ĐÃ THANH LÝ AN TOÀN</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.completed}</div>
            <div className="text-[11px] text-emerald-600 mt-1">Hoàn cọc 100% nguyên vẹn</div>
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

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Có hiệu lực' },
              { id: 'pending_signature', label: 'Chờ ký OTP' },
              { id: 'completed', label: 'Đã thanh lý' },
              { id: 'disputed', label: 'Đang xử lý cọc' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedStatus === tab.id
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
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F6EEEB]">
                {filteredContracts.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FCFAF8] transition-colors group">
                    <td className="py-4 px-4 font-mono font-bold text-[#733F49] text-xs">
                      {item.id}
                      <span className="block text-[10px] text-[#A39192] font-sans font-normal mt-0.5">
                        NV: {item.staffInCharge}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#302626]">{item.customerName}</div>
                      <div className="text-xs text-[#7A6A6B] flex items-center gap-1.5 mt-0.5">
                        <Phone size={11} className="text-[#A39192]" />
                        <span>{item.phone}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.dressImage}
                          alt={item.dressName}
                          className="w-10 h-12 object-cover rounded-md border border-[#EFE5E1] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-[#302626] truncate max-w-[180px]">
                            {item.dressName}
                          </div>
                          <div className="text-xs text-[#A39192] mt-0.5">
                            {item.dressCode} · <span className="text-[#87565C]">{item.dressSize}</span>
                          </div>
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
                          <span>Ký lúc: {item.signedAt}</span>
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
                          className="p-2 rounded-lg text-[#733F49] hover:bg-[#F5EAE6] transition-colors"
                          title="Xem văn bản hợp đồng điện tử"
                        >
                          <Eye size={17} />
                        </button>

                        {item.status === 'pending_signature' && (
                          <button
                            type="button"
                            onClick={() => handleSendReminder(item)}
                            className="p-2 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Gửi lại link ký hợp đồng qua SMS/Email"
                          >
                            <Send size={16} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedContract(item);
                            setTimeout(() => window.print(), 200);
                          }}
                          className="p-2 rounded-lg text-[#7A6A6B] hover:bg-[#F5EAE6] transition-colors"
                          title="In / Xuất PDF"
                        >
                          <Printer size={16} />
                        </button>
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

        {/* Modal Xem Trước Văn Bản Hợp Đồng Điện Tử */}
        {isPreviewOpen && selectedContract && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden my-8 max-h-[90vh] flex flex-col">
              {/* Modal Top Bar */}
              <div className="px-6 py-4 bg-[#FAF5F2] border-b border-[#EFE5E1] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#733F49] text-white flex items-center justify-center font-bold">
                    <FileSignature size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#302626]">
                      Văn Bản Hợp Đồng Điện Tử #{selectedContract.id}
                    </h3>
                    <p className="text-xs text-[#7A6A6B]">
                      Mẫu: {selectedContract.templateName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9C4BD] text-xs font-semibold text-[#733F49] hover:bg-white bg-transparent"
                  >
                    <Printer size={14} />
                    <span>In Hợp Đồng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 rounded-lg text-[#733F49] hover:bg-[#EFE2DE] transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Legal Document Content - Scrollable */}
              <div className="p-8 sm:p-12 overflow-y-auto font-serif text-[#2B2321] leading-relaxed space-y-6 text-sm bg-white">
                {/* Header Republic & Title */}
                <div className="text-center space-y-1 pb-6 border-b border-[#EFE5E1]">
                  <p className="font-sans font-bold text-xs uppercase tracking-widest text-[#7A6A6B]">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="font-sans text-xs italic text-[#7A6A6B]">
                    Độc lập – Tự do – Hạnh phúc
                  </p>
                  <div className="w-20 h-0.5 bg-[#87565C] mx-auto my-3" />
                  <h2 className="text-xl sm:text-2xl font-bold text-[#733F49] uppercase pt-2">
                    HỢP ĐỒNG CHO THUÊ TRANG PHỤC CƯỚI CAO CẤP
                  </h2>
                  <p className="font-sans text-xs text-[#9E8B89]">
                    Số: {selectedContract.id} / HĐ-UNIBRIDAL
                  </p>
                </div>

                {/* Parties Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs border border-[#F0E6E2] p-5 rounded-xl bg-[#FDFBF9]">
                  <div className="space-y-1.5">
                    <p className="font-bold text-sm text-[#733F49] uppercase font-serif">
                      BÊN CHO THUÊ (BÊN A)
                    </p>
                    <p><b>Đơn vị:</b> UNIBRIDAL FLAGSHIP ATELIER HAUTE COUTURE</p>
                    <p><b>Đại diện:</b> Bà Trần Bích Ngọc - Quản lý Showroom</p>
                    <p><b>Địa chỉ:</b> 186 Nam Kỳ Khởi Nghĩa, Phường Võ Thị Sáu, Quận 3, TP.HCM</p>
                    <p><b>Hotline:</b> 1900 888 2026 · <b>Mã số thuế:</b> 0317892026</p>
                  </div>

                  <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-[#F0E6E2] pt-4 md:pt-0 md:pl-6">
                    <p className="font-bold text-sm text-[#733F49] uppercase font-serif">
                      BÊN THUÊ (BÊN B)
                    </p>
                    <p><b>Họ và tên:</b> <span className="font-bold text-[#302626]">{selectedContract.customerName}</span></p>
                    <p><b>Số CCCD/CMND:</b> {selectedContract.idCard}</p>
                    <p><b>Số điện thoại:</b> {selectedContract.phone}</p>
                    <p><b>Địa chỉ nhận trang phục:</b> Nhận trực tiếp tại Private Suite Atelier</p>
                  </div>
                </div>

                {/* Terms of Contract */}
                <div className="space-y-4">
                  <h4 className="font-bold text-base text-[#733F49]">
                    ĐIỀU 1: ĐỐI TƯỢNG VÀ THỜI GIAN THUÊ TRANG PHỤC
                  </h4>
                  <table className="w-full text-left font-sans text-xs border border-[#EAE0DC]">
                    <thead className="bg-[#FAF5F2]">
                      <tr className="border-b border-[#EAE0DC]">
                        <th className="p-2.5">Trang phục</th>
                        <th className="p-2.5">Mã số</th>
                        <th className="p-2.5">Thông số kỹ thuật</th>
                        <th className="p-2.5">Thời gian nhận</th>
                        <th className="p-2.5">Thời gian hoàn trả</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2.5 font-bold">{selectedContract.dressName}</td>
                        <td className="p-2.5 font-mono">{selectedContract.dressCode}</td>
                        <td className="p-2.5">{selectedContract.dressSize}</td>
                        <td className="p-2.5 font-bold text-emerald-700">{selectedContract.startDate}</td>
                        <td className="p-2.5 font-bold text-[#87565C]">{selectedContract.endDate}</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 className="font-bold text-base text-[#733F49] pt-2">
                    ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG &amp; TIỀN ĐẶT CỌC BẢO LÃNH
                  </h4>
                  <ul className="list-disc pl-5 font-sans text-xs space-y-1.5 text-[#594B49]">
                    <li><b>Giá thuê trọn gói:</b> {fmtVnd(selectedContract.rentalPrice)} (Đã bao gồm giặt hấp sinh học Pháp &amp; phụ kiện voan).</li>
                    <li><b>Số tiền cọc bảo lãnh trách nhiệm:</b> {fmtVnd(selectedContract.depositAmount)}.</li>
                    <li>Số tiền cọc sẽ được hoàn trả 100% cho Bên B trong vòng 02 giờ làm việc sau khi Bên A kiểm tra tình trạng váy nguyên vẹn theo biên bản bàn giao.</li>
                  </ul>

                  <h4 className="font-bold text-base text-[#733F49] pt-2">
                    ĐIỀU 3: QUY ĐỊNH BẢO QUẢN &amp; XỬ LÝ HƯ TỔN
                  </h4>
                  <p className="font-sans text-xs text-[#594B49] leading-relaxed">
                    Bên B cam kết giữ gìn trang phục cẩn trọng, không tự ý giặt tẩy hóa chất. Trường hợp làm rách ren, cháy vải hoặc đứt gãy gọng siết eo corsetry, Bên B đồng ý chịu chi phí phục chế nguyên trạng theo bảng giá niêm yết tại Atelier hoặc trừ trực tiếp vào quỹ cọc bảo lãnh.
                  </p>
                </div>

                {/* Signatures Block */}
                <div className="pt-8 border-t border-[#EFE5E1] grid grid-cols-2 gap-8 text-center font-sans text-xs">
                  <div>
                    <p className="font-bold uppercase text-[#733F49]">ĐẠI DIỆN BÊN A (SHOWROOM)</p>
                    <p className="text-[#A39192] italic mt-1">Đã ký bằng chữ ký số Atelier</p>
                    <div className="h-20 flex items-center justify-center">
                      <div className="border border-emerald-500 rounded-lg p-2 bg-emerald-50 text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1.5">
                        <ShieldCheck size={16} />
                        <span>VERIFIED BY UNIBRIDAL CA</span>
                      </div>
                    </div>
                    <p className="font-bold text-[#302626]">{selectedContract.staffInCharge}</p>
                  </div>

                  <div>
                    <p className="font-bold uppercase text-[#733F49]">ĐẠI DIỆN BÊN B (KHÁCH HÀNG)</p>
                    <p className="text-[#A39192] italic mt-1">
                      {selectedContract.signedAt ? 'Xác thực định danh eKYC & SmartOTP' : 'Chưa thực hiện ký điện tử'}
                    </p>
                    <div className="h-20 flex items-center justify-center">
                      {selectedContract.signedAt ? (
                        <div className="border border-emerald-500 rounded-lg p-2 bg-emerald-50 text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1.5">
                          <CheckCircle2 size={16} />
                          <span>E-SIGNED: {selectedContract.customerName}</span>
                        </div>
                      ) : (
                        <div className="border border-dashed border-amber-400 rounded-lg p-2 bg-amber-50 text-amber-700 text-xs">
                          Chờ khách hàng nhập mã OTP xác thực
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-[#302626]">{selectedContract.customerName}</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#FAF5F2] border-t border-[#EFE5E1] flex items-center justify-between shrink-0">
                <span className="text-xs text-[#7A6A6B]">
                  Hợp đồng lưu trữ bảo mật trên Blockchain Ledger UniBridal.
                </span>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#733F49] text-white font-semibold text-xs hover:bg-[#5C323A] transition-colors"
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
