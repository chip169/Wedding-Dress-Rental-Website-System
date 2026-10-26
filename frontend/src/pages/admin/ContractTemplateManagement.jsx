import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Layers,
  FileSignature,
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Edit3,
  Trash2,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  X,
  Printer,
  ShieldCheck,
  Sparkles,
  BookOpen,
  ArrowRight,
  Save,
  Check,
  Scale,
  DollarSign,
  Calendar,
  AlertTriangle,
  History
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MOCK_TEMPLATES = [
  {
    id: 'TPL-HC-01',
    name: 'Mẫu Hợp Đồng Thuê Váy Cưới Haute Couture Tiêu Chuẩn',
    category: 'Haute Couture',
    badge: 'Mặc định hệ thống',
    status: 'active',
    version: 'v2.4',
    updatedAt: '2026-10-15',
    updatedBy: 'Luật sư Trần Văn Bảo (Cố vấn pháp lý)',
    appliedCount: 142,
    defaultDuration: '3 ngày 2 đêm',
    depositRate: '100% giá trị váy hoặc cọc bảo lãnh 15.000.000 VNĐ',
    overdueFee: '500.000 VNĐ / ngày trễ',
    description: 'Áp dụng cho toàn bộ các dòng váy cưới nhập khẩu cao cấp đính kết đá quý và tùng ren nguyên chiếc.',
    clauses: [
      {
        id: 1,
        title: 'Điều 1: Đối tượng hợp đồng & Tình trạng bàn giao',
        content: 'Bên A cho Bên B thuê váy cưới kèm phụ kiện theo đúng biên bản kiểm định tình trạng thực tế tại showroom. Tình trạng hạt đính, form dáng và gọng nẹp được chụp ảnh lưu trữ và ký xác nhận hai bên lúc bàn giao.'
      },
      {
        id: 2,
        title: 'Điều 2: Tiền đặt cọc bảo chứng & Thanh toán',
        content: 'Bên B thanh toán 100% giá trị thuê ngay khi ký hợp đồng và đặt cọc khoản bảo lãnh tài sản (tiền mặt/chuyển khoản hoặc giữ thẻ CCCD gắn chip gốc + 50% tiền cọc). Khoản cọc sẽ được hoàn trả đầy đủ trong 24h sau khi nhận lại sản phẩm nguyên vẹn.'
      },
      {
        id: 3,
        title: 'Điều 3: Quy định sử dụng & Nghiêm cấm',
        content: 'Nghiêm cấm Bên B tự ý mang váy ra tiệm giặt ủi thông thường hoặc xịt nước hoa trực tiếp lên bề mặt tơ lụa nhạy cảm. Không ngồi lên bề mặt sắc nhọn hoặc sử dụng pháo hoa khói màu trực tiếp tiếp xúc bề mặt voan váy.'
      },
      {
        id: 4,
        title: 'Điều 4: Bồi thường hư hỏng & Mất mát',
        content: 'Trường hợp váy bị ố bẩn có thể giặt hấp chuyên sâu: miễn phí xử lý. Trường hợp rách ren, đứt cước: phụ phí phục chế thủ công từ 500.000 - 2.500.000 VNĐ. Trường hợp hư hại không thể khắc phục: bồi hoàn 100% giá trị niêm yết của váy.'
      },
      {
        id: 5,
        title: 'Điều 5: Giá trị pháp lý chữ ký điện tử',
        content: 'Hợp đồng được ký kết thông qua mã xác thực SmartOTP điện tử gửi về số điện thoại chính chủ của Bên B, có giá trị pháp lý tương đương văn bản giấy theo Luật Giao dịch Điện tử Việt Nam.'
      }
    ]
  },
  {
    id: 'TPL-BESPOKE-02',
    name: 'Mẫu Hợp Đồng May Đo Thiết Kế Độc Bản & Thuê Nước Đầu',
    category: 'Bespoke First-Wear',
    badge: 'Hạng sang Exclusive',
    status: 'active',
    version: 'v3.1',
    updatedAt: '2026-10-18',
    updatedBy: 'Giám đốc Sáng tạo Lê Minh Khôi',
    appliedCount: 38,
    defaultDuration: '5 ngày 4 đêm',
    depositRate: '25.000.000 VNĐ / sản phẩm',
    overdueFee: '1.000.000 VNĐ / ngày trễ',
    description: 'Áp dụng cho cô dâu đặt may mẫu mới theo số đo riêng, độc quyền mặc lần đầu (First-Wear) trước khi chuyển vào bộ sưu tập showroom.',
    clauses: [
      {
        id: 1,
        title: 'Điều 1: Lộ trình may đo & Fitting thử váy',
        content: 'Bên A cam kết hoàn thiện bản dựng mộc (Toile) sau 10 ngày và bản hoàn thiện đính kết sau 25 ngày. Bên B có 03 buổi fitting trực tiếp tại Atelier để căn chỉnh số đo ôm khít hoàn hảo.'
      },
      {
        id: 2,
        title: 'Điều 2: Đặc quyền First-Wear & Bản quyền thiết kế',
        content: 'Bên B là người đầu tiên và duy nhất mặc trang phục trong sự kiện cưới của mình. Bản quyền thiết kế và kiểu dáng thuộc sở hữu thương hiệu UniBridal.'
      },
      {
        id: 3,
        title: 'Điều 3: Đặt cọc nguyên phụ liệu & Rủi ro hủy đơn',
        content: 'Khoản cọc giữ lịch sản xuất 50% không hoàn lại sau khi Bên A đã cắt vải ren tơ tằm nhập khẩu theo số đo riêng của Bên B.'
      },
      {
        id: 4,
        title: 'Điều 4: Trách nhiệm bảo toàn phom dáng',
        content: 'Sau khi sử dụng, Bên B hoàn trả váy nguyên vẹn kèm hộp bảo quản chuyên dụng và tùng váy lồng khung đi kèm.'
      }
    ]
  },
  {
    id: 'TPL-COMBO-03',
    name: 'Mẫu Hợp Đồng Trọn Gói Combo Pre-Wedding & Lễ Cưới Chính',
    category: 'Combo Trọn Gói',
    badge: 'Ưu đãi Best-Seller',
    status: 'active',
    version: 'v2.0',
    updatedAt: '2026-09-30',
    updatedBy: 'Quản lý Showroom Nguyễn Thu Trang',
    appliedCount: 95,
    defaultDuration: '7 ngày chia làm 2 đợt',
    depositRate: '12.000.000 VNĐ (Áp dụng gộp cả 2 đợt)',
    overdueFee: '400.000 VNĐ / ngày trễ',
    description: 'Hợp đồng liên thông 2 giai đoạn: Thuê váy chụp ảnh ngoại cảnh/studio + Váy làm lễ cưới chính tiệc gia tiên và nhà hàng.',
    clauses: [
      {
        id: 1,
        title: 'Điều 1: Quy định phân chia 2 đợt sử dụng',
        content: 'Đợt 1 (Chụp ảnh Pre-Wedding): 02 váy chụp phong cách nhẹ nhàng. Đợt 2 (Lễ Cưới): 01 váy đón khách + 01 váy Big Ballgown làm lễ chính sân khấu.'
      },
      {
        id: 2,
        title: 'Điều 2: Hỗ trợ đặc thù khi chụp ngoại cảnh (Biển/Đồi/Rừng)',
        content: 'Chấp nhận cát biển và bụi cỏ khô bám tà váy thông thường. Không ngâm váy ngập nước biển mặn quá 30 phút gây hư tổn gỉ sét gọng thép định hình eo.'
      },
      {
        id: 3,
        title: 'Điều 3: Đổi mẫu váy linh hoạt',
        content: 'Bên B được phép đổi mẫu váy cưới chính tiệc 01 lần miễn phí trước ngày cưới 15 ngày nếu showroom có mẫu mới ra mắt cùng phân khúc giá.'
      }
    ]
  },
  {
    id: 'TPL-AODAI-04',
    name: 'Mẫu Hợp Đồng Thuê Áo Dài Cưới & Trang Phục Dạm Ngõ',
    category: 'Áo Dài Cưới',
    badge: 'Truyền thống',
    status: 'active',
    version: 'v1.8',
    updatedAt: '2026-08-20',
    updatedBy: 'Ban Pháp chế UniBridal',
    appliedCount: 64,
    defaultDuration: '2 ngày 1 đêm',
    depositRate: '5.000.000 VNĐ / cặp cô dâu chú rể',
    overdueFee: '200.000 VNĐ / ngày trễ',
    description: 'Áp dụng cho dòng áo dài nhung the, tơ tằm thêu tay chim công, đính đá hoàng gia và đội hình bê tráp.',
    clauses: [
      {
        id: 1,
        title: 'Điều 1: Bảo quản tơ tằm thêu tay',
        content: 'Áo dài lụa tự nhiên và nhung the dễ bị trầy xước bởi kim băng, hoa cài áo nhọn. Bên B sử dụng kẹp nam châm hoa cài đi kèm do Bên A cung cấp.'
      },
      {
        id: 2,
        title: 'Điều 2: Đổi size đội bê tráp',
        content: 'Hỗ trợ đổi size đội tráp nam/nữ miễn phí trước 48h tính từ giờ nhận trang phục.'
      }
    ]
  },
  {
    id: 'TPL-VIP-05',
    name: 'Mẫu Hợp Đồng Bảo Hiểm Toàn Diện Dành Cho Khách Hàng VIP Diamond',
    category: 'VIP Diamond',
    badge: 'Miễn trừ bồi thường',
    status: 'active',
    version: 'v1.2',
    updatedAt: '2026-10-05',
    updatedBy: 'Tổng Giám Đốc Phê Duyệt',
    appliedCount: 19,
    defaultDuration: '5 ngày',
    depositRate: 'Miễn ký quỹ tiền mặt (Tín nhiệm thành viên Diamond)',
    overdueFee: 'Miễn phí gia hạn 24h đầu',
    description: 'Mẫu hợp đồng cao cấp tích hợp gói bảo hiểm rủi ro hư hỏng tơ lụa trị giá 5.000.000 VNĐ đi kèm.',
    clauses: [
      {
        id: 1,
        title: 'Điều 1: Miễn trừ trách nhiệm hư hao thông thường',
        content: 'Khách hàng VIP được bảo hiểm chi trả 100% mọi sự cố ố bẩn vang đỏ, rách gấu váy do di chuyển hoặc bung chỉ hạt đính kết.'
      },
      {
        id: 2,
        title: 'Điều 2: Dịch vụ hỗ trợ Stylist tận nơi',
        content: 'Bên A cử chuyên viên hỗ trợ mặc váy và phụ tá tại phòng chờ cô dâu trước giờ vào lễ đường.'
      }
    ]
  },
  {
    id: 'TPL-DRAFT-06',
    name: 'Mẫu Hợp Đồng Thuê Trang Phục Cưới Điểm Đến (Destination Wedding)',
    category: 'Destination Wedding',
    badge: 'Bản thảo thử nghiệm',
    status: 'draft',
    version: 'v0.9-draft',
    updatedAt: '2026-10-21',
    updatedBy: 'Trần Bích Ngọc',
    appliedCount: 0,
    defaultDuration: '10 ngày xuyên quốc gia',
    depositRate: '150% giá trị váy (Kèm vali bảo hộ hàng không)',
    overdueFee: '800.000 VNĐ / ngày trễ',
    description: 'Dành riêng cho các tiệc cưới tổ chức tại nước ngoài hoặc đảo Phú Quốc, Đà Nẵng, Nha Trang yêu cầu đóng gói ký gửi máy bay.',
    clauses: [
      {
        id: 1,
        title: 'Điều 1: Tiêu chuẩn đóng kiện bay quốc tế',
        content: 'Trang phục được đóng trong vali chống sốc chuyên dụng có hút ẩm và mã khóa TSA hàng không.'
      },
      {
        id: 2,
        title: 'Điều 2: Xử lý rủi ro thất lạc hành lý bay',
        content: 'Trường hợp hãng hàng không làm chậm trễ hoặc thất lạc hành lý có xác nhận biên bản sân bay PIR, hai bên hỗ trợ chia sẻ chi phí phát sinh.'
      }
    ]
  }
];

export default function ContractTemplateManagement() {
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'clauses' | 'audit'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal States
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editTemplate, setEditTemplate] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showToast, setShowToast] = useState('');

  // Clause Library Mock
  const clauseLibrary = [
    {
      category: 'Bảo lãnh & Đặt cọc',
      title: 'Điều khoản cọc bảo chứng tài sản bằng CCCD gắn chip',
      snippet: 'Bên B đồng ý xuất trình và để Bên A đối chiếu thông tin CCCD gắn chip gốc, đồng thời đặt cọc số tiền tương đương 50% giá niêm yết...',
      usedIn: 4
    },
    {
      category: 'Bồi thường hư hại',
      title: 'Quy chuẩn đền bù vỡ hạt pha lê Swarovski & ren rách',
      snippet: 'Trường hợp đính kết thủ công bị rơi rớt vượt quá 5% diện tích hoặc rách ren phần ngực, Bên B chịu chi phí phục hồi theo báo giá của xưởng thêu...',
      usedIn: 5
    },
    {
      category: 'Bất khả kháng',
      title: 'Miễn trừ trách nhiệm thiên tai & dịch bệnh theo công bố chính phủ',
      snippet: 'Nếu sự kiện cưới bị hoãn do thiên tai bất khả kháng được cơ quan nhà nước ban bố tình trạng khẩn cấp, hai bên được phép bảo lưu hợp đồng trong 180 ngày...',
      usedIn: 6
    },
    {
      category: 'Ký số điện tử',
      title: 'Xác thực định danh e-KYC và chữ ký số một lần qua SMS OTP',
      snippet: 'Mã xác thực 6 số gửi tới số thuê bao đã đăng ký chính chủ là bằng chứng pháp lý không thể chối bỏ về sự đồng thuận của Bên B đối với toàn văn hợp đồng...',
      usedIn: 6
    }
  ];

  const triggerToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 3000);
  };

  // Filter logic
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchSearch =
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
      const matchStatus = selectedStatus === 'all' || tpl.status === selectedStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [templates, searchQuery, selectedCategory, selectedStatus]);

  // Handler duplicate
  const handleDuplicate = (tpl) => {
    const newTpl = {
      ...tpl,
      id: `TPL-COPY-${Date.now().toString().slice(-4)}`,
      name: `${tpl.name} (Bản sao)`,
      status: 'draft',
      badge: 'Bản thảo nhân bản',
      version: 'v1.0-draft',
      updatedAt: '2026-10-22',
      appliedCount: 0
    };
    setTemplates([newTpl, ...templates]);
    triggerToast(`Đã nhân bản mẫu "${tpl.name}" thành công!`);
  };

  // Handler delete
  const handleDelete = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn ngừng sử dụng mẫu "${name}"?`)) {
      setTemplates(templates.filter((t) => t.id !== id));
      triggerToast(`Đã xóa mẫu hợp đồng ${id}`);
    }
  };

  return (
    <AdminLayout
      activeMenu="contract-templates"
      title="Quản Lý Mẫu Hợp Đồng"
      subtitle="Thiết lập cấu trúc pháp lý, quy chuẩn tiền cọc & chính sách bồi thường áp dụng toàn hệ thống"
      controls={
        <div className="flex items-center gap-3">
          <Link
            to="/admin/hop-dong"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#8C7A6B] bg-white border border-[#E8DFD8] rounded-xl hover:bg-[#FDFBF7] transition-all"
          >
            <FileSignature className="w-4 h-4 text-[#C5A880]" />
            Xem Danh Sách Hợp Đồng Đã Ký
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#C5A880] to-[#B39366] rounded-xl shadow-md hover:shadow-lg hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tạo Mẫu Mới
          </button>
        </div>
      }
    >
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#2C2523] text-[#FAF7F2] text-xs font-medium rounded-xl shadow-2xl border border-[#C5A880]/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#D8B168]" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-[#EFE5E1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#9E8E81] font-semibold">Mẫu Tiêu Chuẩn</p>
            <h3 className="text-2xl font-bold text-[#2C2523] mt-1">05 <span className="text-xs font-normal text-emerald-600">Đang áp dụng</span></h3>
            <p className="text-[11px] text-[#A39284] mt-1">+1 Bản thảo thử nghiệm</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#C5A880] flex items-center justify-center border border-[#F4EBE6]">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EFE5E1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#9E8E81] font-semibold">Hợp Đồng Ký Theo Mẫu</p>
            <h3 className="text-2xl font-bold text-[#2C2523] mt-1">358 <span className="text-xs font-normal text-[#C5A880]">Lượt</span></h3>
            <p className="text-[11px] text-emerald-600 mt-1">Tỷ lệ ký số thành công 98.4%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <FileSignature className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EFE5E1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#9E8E81] font-semibold">Tỷ Lệ Cọc Trung Bình</p>
            <h3 className="text-2xl font-bold text-[#2C2523] mt-1">100% <span className="text-xs font-normal text-[#9E8E81]">giá thuê</span></h3>
            <p className="text-[11px] text-[#A39284] mt-1">Bảo chứng tài sản an toàn tuyệt đối</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#EFE5E1] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-[#9E8E81] font-semibold">Quy Chuẩn Pháp Lý</p>
            <h3 className="text-2xl font-bold text-[#2C2523] mt-1">eID 2026</h3>
            <p className="text-[11px] text-[#A39284] mt-1">Cập nhật Luật Giao dịch điện tử</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-[#EAE0D7] mb-6 gap-6">
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'templates'
              ? 'text-[#C5A880] border-b-2 border-[#C5A880]'
              : 'text-[#8C7A6B] hover:text-[#2C2523]'
          }`}
        >
          Danh Sách Mẫu Hợp Đồng ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('clauses')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'clauses'
              ? 'text-[#C5A880] border-b-2 border-[#C5A880]'
              : 'text-[#8C7A6B] hover:text-[#2C2523]'
          }`}
        >
          Thư Viện Điều Khoản Tiêu Chuẩn ({clauseLibrary.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'matrix'
              ? 'text-[#C5A880] border-b-2 border-[#C5A880]'
              : 'text-[#8C7A6B] hover:text-[#2C2523]'
          }`}
        >
          Bảng Quy Chuẩn Đền Bù Hư Hỏng
        </button>
      </div>

      {/* TAB 1: DANH SÁCH MẪU HỢP ĐỒNG */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-[#EFE5E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#A8988B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên mẫu, mã mẫu (TPL-HC-01), loại hình..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:outline-none focus:border-[#C5A880] focus:bg-white text-[#2C2523] placeholder-[#A8988B]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl text-[#2C2523] focus:outline-none focus:border-[#C5A880]"
              >
                <option value="all">Tất cả phân loại</option>
                <option value="Haute Couture">Haute Couture</option>
                <option value="Bespoke First-Wear">Bespoke First-Wear</option>
                <option value="Combo Trọn Gói">Combo Trọn Gói</option>
                <option value="Áo Dài Cưới">Áo Dài Cưới</option>
                <option value="VIP Diamond">VIP Diamond</option>
                <option value="Destination Wedding">Destination Wedding</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl text-[#2C2523] focus:outline-none focus:border-[#C5A880]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang áp dụng (Active)</option>
                <option value="draft">Bản nháp (Draft)</option>
              </select>
            </div>
          </div>

          {/* Grid of Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-[#EFE5E1] shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Header card */}
                <div className="p-5 border-b border-[#F7EFEA]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#8C7A6B] border border-[#E8DFD8]">
                      {tpl.id}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        tpl.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {tpl.status === 'active' ? 'Đang hiệu lực' : 'Bản thảo thử nghiệm'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#2C2523] leading-snug group-hover:text-[#C5A880] transition-colors">
                    {tpl.name}
                  </h4>
                  <p className="text-xs text-[#8C7A6B] mt-2 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                {/* Body Specs */}
                <div className="p-5 space-y-2.5 text-xs bg-[#FDFBF9]/60 flex-1">
                  <div className="flex items-center justify-between text-[#8C7A6B]">
                    <span className="flex items-center gap-1.5 text-[#9E8E81]">
                      <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                      Thời lượng thuê chuẩn:
                    </span>
                    <span className="font-semibold text-[#2C2523]">{tpl.defaultDuration}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#8C7A6B]">
                    <span className="flex items-center gap-1.5 text-[#9E8E81]">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      Quy định cọc:
                    </span>
                    <span className="font-semibold text-[#2C2523] max-w-[170px] truncate text-right">
                      {tpl.depositRate}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#8C7A6B]">
                    <span className="flex items-center gap-1.5 text-[#9E8E81]">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      Phạt chậm trả:
                    </span>
                    <span className="font-semibold text-rose-600">{tpl.overdueFee}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#8C7A6B] pt-2 border-t border-[#F2E8E2]">
                    <span className="text-[11px] text-[#A39284]">Số lượt hợp đồng áp dụng:</span>
                    <span className="font-bold text-[#C5A880] bg-[#FAF3EC] px-2 py-0.5 rounded-md">
                      {tpl.appliedCount} hợp đồng
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-[#F7EFEA] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewTemplate(tpl)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#2C2523] bg-[#FAF7F2] hover:bg-[#F2ECE4] rounded-xl transition-all border border-[#E8DFD8]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                    Xem Mẫu
                  </button>

                  <button
                    onClick={() => setEditTemplate(tpl)}
                    title="Chỉnh sửa điều khoản"
                    className="p-2 text-[#8C7A6B] hover:text-[#C5A880] hover:bg-[#FAF7F2] rounded-xl transition-all border border-transparent hover:border-[#E8DFD8]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(tpl)}
                    title="Nhân bản mẫu"
                    className="p-2 text-[#8C7A6B] hover:text-[#C5A880] hover:bg-[#FAF7F2] rounded-xl transition-all border border-transparent hover:border-[#E8DFD8]"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(tpl.id, tpl.name)}
                    title="Xóa mẫu"
                    className="p-2 text-[#8C7A6B] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: THƯ VIỆN ĐIỀU KHOẢN TIÊU CHUẨN */}
      {activeTab === 'clauses' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#2C2523] to-[#423835] text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#D8B168] font-bold">Standard Clause Bank</span>
              <h3 className="text-xl font-bold font-serif mt-1">Thư Viện Điều Khoản Pháp Lý Chuẩn Hóa</h3>
              <p className="text-xs text-[#E5D7CC] mt-1 max-w-2xl leading-relaxed">
                Tập hợp các điều khoản đã được cố vấn pháp lý kiểm định. Khi áp dụng vào bất kỳ mẫu hợp đồng mới, các biến số (Tên váy, Tiền cọc, Ngày thuê) sẽ tự động liên kết dữ liệu.
              </p>
            </div>
            <button
              onClick={() => triggerToast('Đã mở công cụ soạn thảo điều khoản mẫu mới')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C5A880] hover:bg-[#B39366] text-white text-xs font-semibold rounded-xl shrink-0 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Thêm Điều Khoản Mẫu
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clauseLibrary.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-[#EFE5E1] shadow-xs hover:border-[#C5A880]/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#C5A880] bg-[#FAF3EC] px-2.5 py-0.5 rounded-md">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-[#A39284]">Được dùng trong {item.usedIn} mẫu</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#2C2523] mb-2">{item.title}</h4>
                  <p className="text-xs text-[#8C7A6B] leading-relaxed italic bg-[#FDFBF9] p-3 rounded-xl border border-[#F2E8E2]">
                    "{item.snippet}"
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#F7EFEA] flex items-center justify-end gap-2">
                  <button
                    onClick={() => triggerToast('Đã sao chép nội dung điều khoản vào Clipboard')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7A6B] hover:text-[#C5A880] py-1 px-2.5 rounded-lg hover:bg-[#FAF7F2] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Sao chép điều khoản
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BẢNG QUY CHUẨN ĐỀN BÙ HƯ HỎNG */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#F2E8E2] bg-[#FAF7F2]/60">
            <h3 className="text-base font-bold text-[#2C2523]">Bảng Định Mức Bồi Thường & Khắc Phục Hư Tổn Váy Cưới</h3>
            <p className="text-xs text-[#8C7A6B] mt-1">
              Phụ lục chuẩn đính kèm tự động trong mọi hợp đồng điện tử để minh bạch hóa chi phí với cô dâu chú rể khi hoàn trả trang phục.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#8C7A6B] uppercase font-semibold text-[10px] tracking-wider border-b border-[#EFE5E1]">
                <tr>
                  <th className="py-3 px-5">Mức độ hư tổn</th>
                  <th className="py-3 px-5">Mô tả chi tiết sự cố</th>
                  <th className="py-3 px-5">Quy trình xử lý tại Atelier</th>
                  <th className="py-3 px-5 text-right">Mức phí áp dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4ECE7] text-[#2C2523]">
                <tr className="hover:bg-[#FDFBF9]">
                  <td className="py-4 px-5">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Cấp độ 1: Bẩn nhẹ
                    </span>
                  </td>
                  <td className="py-4 px-5">Bụi đất bám tà dưới do di chuyển sân khấu hoặc chụp studio thông thường.</td>
                  <td className="py-4 px-5 text-[#8C7A6B]">Giặt hấp Dry-cleaning công nghệ Ozone tiêu chuẩn showroom.</td>
                  <td className="py-4 px-5 text-right font-bold text-emerald-600">MIỄN PHÍ</td>
                </tr>

                <tr className="hover:bg-[#FDFBF9]">
                  <td className="py-4 px-5">
                    <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Cấp độ 2: Ố bẩn cứng đầu
                    </span>
                  </td>
                  <td className="py-4 px-5">Vết vang đỏ, son môi, thức ăn dầu mỡ dính diện rộng lên lụa Mikado hoặc Tulle.</td>
                  <td className="py-4 px-5 text-[#8C7A6B]">Hóa chất tẩy sinh học Pháp chuyên dụng bảo vệ sợi tơ tằm.</td>
                  <td className="py-4 px-5 text-right font-bold text-amber-600">300.000 - 600.000 VNĐ</td>
                </tr>

                <tr className="hover:bg-[#FDFBF9]">
                  <td className="py-4 px-5">
                    <span className="font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                      Cấp độ 3: Rách ren / Rơi hạt
                    </span>
                  </td>
                  <td className="py-4 px-5">Rách voan tà ngoài &lt; 10cm, đứt chuỗi pha lê Swarovski, tuột cúc ngọc trai.</td>
                  <td className="py-4 px-5 text-[#8C7A6B]">Nghệ nhân đính kết may phục hồi thủ công theo bản vẽ gốc.</td>
                  <td className="py-4 px-5 text-right font-bold text-orange-600">800.000 - 2.500.000 VNĐ</td>
                </tr>

                <tr className="hover:bg-[#FDFBF9]">
                  <td className="py-4 px-5">
                    <span className="font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      Cấp độ 4: Hư hỏng nghiêm trọng
                    </span>
                  </td>
                  <td className="py-4 px-5">Cháy sém do pháo hoa, biến dạng gọng corset không thể nắn, mất hẳn phụ kiện đi kèm.</td>
                  <td className="py-4 px-5 text-[#8C7A6B]">Váy bị loại bỏ hoàn toàn khỏi bộ sưu tập cho thuê.</td>
                  <td className="py-4 px-5 text-right font-bold text-rose-600">100% Giá trị váy niêm yết</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW MẪU HỢP ĐỒNG */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8DFD8] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EFE5E1] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-[#C5A880] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2C2523]">{previewTemplate.name}</h3>
                  <p className="text-xs text-[#8C7A6B]">
                    Mã mẫu: <span className="font-mono font-bold text-[#C5A880]">{previewTemplate.id}</span> • Phiên bản: {previewTemplate.version}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E0D5CE] text-[#8C7A6B] hover:text-[#2C2523] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Document Preview Style */}
            <div className="p-8 overflow-y-auto space-y-6 text-[#2C2523] font-serif bg-[#FCFAF8]">
              {/* National Header */}
              <div className="text-center space-y-1 font-sans border-b border-[#E8DFD8] pb-6">
                <p className="text-xs uppercase font-bold tracking-widest text-[#594B43]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="text-xs italic text-[#7C695D]">Độc lập – Tự do – Hạnh phúc</p>
                <div className="w-24 h-0.5 bg-[#C5A880] mx-auto my-3" />
                <h2 className="text-lg font-bold font-serif text-[#2C2523] uppercase mt-2">
                  {previewTemplate.name}
                </h2>
                <p className="text-xs font-mono text-[#8C7A6B]">Số: HDDT/{previewTemplate.id}/[MÃ_ĐƠN_THUÊ]</p>
              </div>

              {/* Legal Notice */}
              <div className="font-sans text-xs bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 text-[#735A47] flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Quy chuẩn dịch vụ UniBridal Haute Couture:</p>
                  <p className="mt-0.5 leading-relaxed">
                    Hợp đồng này được kích hoạt điện tử tức thời khi khách hàng hoàn tất xác thực SmartOTP. Mọi điều khoản bên dưới được bảo đảm quyền lợi tối đa cho sự kiện trọng đại của Quý khách.
                  </p>
                </div>
              </div>

              {/* Clauses list */}
              <div className="space-y-4 font-sans text-xs">
                {previewTemplate.clauses.map((clause, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-[#EFE5E1] shadow-2xs">
                    <h5 className="font-bold text-sm text-[#2C2523] mb-1.5 text-serif">{clause.title}</h5>
                    <p className="text-[#69584D] leading-relaxed text-xs">{clause.content}</p>
                  </div>
                ))}
              </div>

              {/* Metadata */}
              <div className="font-sans text-xs text-[#8C7A6B] pt-4 border-t border-[#E8DFD8] flex items-center justify-between">
                <span>Người phê duyệt văn bản: <strong>{previewTemplate.updatedBy}</strong></span>
                <span>Ngày cập nhật: {previewTemplate.updatedAt}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-[#EFE5E1] flex items-center justify-between">
              <button
                onClick={() => {
                  window.print();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#8C7A6B] hover:text-[#2C2523] bg-[#FAF7F2] rounded-xl border border-[#E8DFD8]"
              >
                <Printer className="w-4 h-4" />
                In Mẫu Thử Nghiệm
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const t = previewTemplate;
                    setPreviewTemplate(null);
                    setEditTemplate(t);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#C5A880] to-[#B39366] rounded-xl shadow-xs hover:shadow-md"
                >
                  Chỉnh Sửa Điều Khoản Mẫu Này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT TEMPLATE */}
      {editTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8DFD8] overflow-hidden">
            <div className="p-5 border-b border-[#EFE5E1] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-[#C5A880] flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2C2523]">Chỉnh Sửa Mẫu Hợp Đồng</h3>
                  <p className="text-xs text-[#8C7A6B]">{editTemplate.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditTemplate(null)}
                className="w-8 h-8 rounded-full bg-white border border-[#E0D5CE] text-[#8C7A6B] hover:text-[#2C2523] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTemplates(templates.map((t) => (t.id === editTemplate.id ? editTemplate : t)));
                setEditTemplate(null);
                triggerToast('Đã lưu các thay đổi cho mẫu hợp đồng!');
              }}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Tên Mẫu Hợp Đồng</label>
                <input
                  type="text"
                  value={editTemplate.name}
                  onChange={(e) => setEditTemplate({ ...editTemplate, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523] font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Thời Lượng Thuê Chuẩn</label>
                  <input
                    type="text"
                    value={editTemplate.defaultDuration}
                    onChange={(e) => setEditTemplate({ ...editTemplate, defaultDuration: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Phí Trễ Hạn / Ngày</label>
                  <input
                    type="text"
                    value={editTemplate.overdueFee}
                    onChange={(e) => setEditTemplate({ ...editTemplate, overdueFee: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Quy Định Đặt Cọc Bảo Chứng</label>
                <input
                  type="text"
                  value={editTemplate.depositRate}
                  onChange={(e) => setEditTemplate({ ...editTemplate, depositRate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Mô Tả Áp Dụng</label>
                <textarea
                  rows={2}
                  value={editTemplate.description}
                  onChange={(e) => setEditTemplate({ ...editTemplate, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523] leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-[#F2E8E2] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditTemplate(null)}
                  className="px-4 py-2 font-semibold text-[#8C7A6B] hover:text-[#2C2523] bg-[#FAF7F2] rounded-xl border border-[#E8DFD8]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-gradient-to-r from-[#C5A880] to-[#B39366] rounded-xl shadow-xs hover:shadow-md"
                >
                  Lưu Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREATE NEW TEMPLATE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E8DFD8] overflow-hidden">
            <div className="p-5 border-b border-[#EFE5E1] flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-[#C5A880] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2C2523]">Tạo Mẫu Hợp Đồng Mới</h3>
                  <p className="text-xs text-[#8C7A6B]">Tích hợp tự động vào danh mục hợp đồng dịch vụ</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#E0D5CE] text-[#8C7A6B] hover:text-[#2C2523] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const newTpl = {
                  id: `TPL-CUSTOM-${Date.now().toString().slice(-4)}`,
                  name: form.name.value,
                  category: form.category.value,
                  badge: 'Mẫu tùy chỉnh mới',
                  status: 'active',
                  version: 'v1.0',
                  updatedAt: '2026-10-22',
                  updatedBy: 'Quản trị viên Showroom',
                  appliedCount: 0,
                  defaultDuration: form.duration.value || '3 ngày 2 đêm',
                  depositRate: form.deposit.value || '100% giá thuê',
                  overdueFee: form.overdue.value || '500.000 VNĐ / ngày',
                  description: form.desc.value || 'Mẫu hợp đồng được thiết lập cho gói dịch vụ mới.',
                  clauses: [
                    {
                      id: 1,
                      title: 'Điều 1: Bàn giao và kiểm tra hiện trạng',
                      content: 'Khách hàng cùng nhân viên phụ trách chụp ảnh xác thực tình trạng váy trước khi rời showroom.'
                    },
                    {
                      id: 2,
                      title: 'Điều 2: Tiền đặt cọc và chính sách hoàn trả',
                      content: 'Khoản cọc được hoàn trả trong vòng 24h sau khi nhận lại trang phục và phụ kiện nguyên vẹn.'
                    }
                  ]
                };
                setTemplates([newTpl, ...templates]);
                setIsCreateModalOpen(false);
                triggerToast(`Đã tạo thành công mẫu "${newTpl.name}"!`);
              }}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Tên Mẫu Hợp Đồng *</label>
                <input
                  name="name"
                  type="text"
                  placeholder="VD: Hợp Đồng Thuê Váy Cưới Destination Wedding Phú Quốc"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Phân Loại Dịch Vụ</label>
                  <select
                    name="category"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                  >
                    <option value="Haute Couture">Haute Couture</option>
                    <option value="Bespoke First-Wear">Bespoke First-Wear</option>
                    <option value="Combo Trọn Gói">Combo Trọn Gói</option>
                    <option value="Áo Dài Cưới">Áo Dài Cưới</option>
                    <option value="VIP Diamond">VIP Diamond</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Thời Lượng Thuê Chuẩn</label>
                  <input
                    name="duration"
                    type="text"
                    defaultValue="3 ngày 2 đêm"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Quy Định Đặt Cọc</label>
                  <input
                    name="deposit"
                    type="text"
                    defaultValue="15.000.000 VNĐ hoặc 100% giá trị váy"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Phí Trễ Hạn / Ngày</label>
                  <input
                    name="overdue"
                    type="text"
                    defaultValue="500.000 VNĐ / ngày trễ"
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Mô Tả Ngắn Về Mẫu</label>
                <textarea
                  name="desc"
                  rows={2}
                  placeholder="Ghi chú đối tượng khách hàng hoặc các lưu ý đặc thù về vải voan, đính kết..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                />
              </div>

              <div className="pt-2 border-t border-[#F2E8E2] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-[#8C7A6B] hover:text-[#2C2523] bg-[#FAF7F2] rounded-xl border border-[#E8DFD8]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-gradient-to-r from-[#C5A880] to-[#B39366] rounded-xl shadow-xs hover:shadow-md"
                >
                  Tạo Mẫu Hợp Đồng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
