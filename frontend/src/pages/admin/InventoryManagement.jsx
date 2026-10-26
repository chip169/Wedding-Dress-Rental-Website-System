import React, { useState, useMemo } from 'react';
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
  Snowflake,
  Droplets,
  Wrench,
  Gem,
  MoreVertical,
  Download,
  FileSpreadsheet,
  Check,
  ClipboardCheck,
  ShieldAlert
} from 'lucide-react';
import HangerIcon from '../../components/common/HangerIcon';
import ShelvesIcon from '../../components/common/ShelvesIcon';

import card1Elysian from '../../assets/card1_elysian.jpg';
import card2Celeste from '../../assets/card2_celeste.jpg';
import card3Lumiere from '../../assets/card3_lumiere.jpg';
import card4Monet from '../../assets/card4_monet.jpg';
import card5Aurora from '../../assets/card5_aurora.jpg';
import card6Seraphina from '../../assets/card6_seraphina.jpg';

const INVENTORY_ITEMS = [
  {
    id: 1,
    name: 'Elysian Rose',
    code: 'KHÔ-BALL-01',
    collection: 'ATELIER ROYAL',
    image: card1Elysian,
    location: 'Tủ Treo A1 - Kệ 03',
    rfid: 'RFID: #RF-9921-A1',
    conditionType: 'cold', // cold | humidity | restore | diamond
    conditionText: 'Kho Lạnh Tơ Tằm (19°C)',
    description: 'Tùng xòe 7 tầng voan Pháp, ren Chantilly',
    sizes: [
      { label: 'Size S: 02' },
      { label: 'Size M: 02' },
    ],
    totalUnits: 'Tổng: 04 bộ',
    statusText: 'ĐẠT CHUẨN LƯU KHO',
    statusType: 'stored', // stored | ready | drying | pending
    inspectDate: '18/10/2025',
    inspector: 'Bởi: Bích Ngọc',
    inspectNote: 'Phom 10/10 Khô',
    inspectNoteColor: 'green',
  },
  {
    id: 2,
    name: 'Aurora Pearl',
    code: 'KHÔ-SHE-02',
    collection: 'SILK MINIMALIST',
    image: card5Aurora,
    location: 'Tủ Treo B2 - Kệ 01',
    rfid: 'RFID: #RF-4412-B2',
    conditionType: 'humidity',
    conditionText: 'Kho Chống Ẩm Cao Cấp',
    description: 'Crepe de Chine dệt bóng, kết ngọc trai nước ngọt',
    sizes: [
      { label: 'Size S: 01' },
      { label: 'Size L: 01' },
    ],
    outOfStockSize: 'Size M hết hàng',
    statusText: 'SẴN SÀNG XUẤT GIAO',
    statusType: 'ready',
    inspectDate: '17/10/2025',
    inspector: 'Bởi: Thu Thảo',
    inspectNote: 'Độ bóng nguyên bản',
    inspectNoteColor: 'green',
  },
  {
    id: 3,
    name: 'Monet Floral',
    code: 'KHÔ-FLOR-03',
    collection: 'ARTISAN GARDEN',
    image: card4Monet,
    location: 'Tủ Treo C1 - Kệ 04',
    rfid: 'RFID: #RF-7128-C1',
    conditionType: 'restore',
    conditionText: 'Bảo Dưỡng Phục Hồi Riêng',
    description: '400 cánh hoa lụa organza thêu nổi 3D',
    sizes: [
      { label: 'Size S: 01' },
      { label: 'Size M: 01' },
    ],
    totalUnits: 'Tổng: 02 bộ',
    statusText: 'GIẶT SẤY NHIỆT THẤP',
    statusType: 'drying',
    inspectDate: '16/10/2025',
    inspector: 'Bởi: Trịnh Quỳnh',
    inspectNote: 'Dặm 6 cánh hoa',
    inspectNoteColor: 'orange',
  },
  {
    id: 4,
    name: 'Celeste Mermaid',
    code: 'KHÔ-MER-04',
    collection: 'COUTURE SIREN',
    image: card2Celeste,
    location: 'Tủ Treo A3 - Kệ 05',
    rfid: 'RFID: #RF-3398-A3',
    conditionType: 'cold',
    conditionText: 'Kho Lạnh Tơ Tằm (18.5°C)',
    description: 'Phom đuôi cá siết eo tỉ lệ vàng, đính cườm',
    sizes: [
      { label: 'Size XS: 01' },
      { label: 'Size S: 02' },
      { label: 'Size M: 01' },
    ],
    totalUnits: 'Tổng: 04 bộ',
    statusText: 'CHỜ KIỂM ĐỊNH SAU THUÊ',
    statusType: 'pending',
    inspectDate: '18/10/2025',
    inspector: 'Bởi: Bích Ngọc',
    inspectNote: 'Khảo sát viền gấu',
    inspectNoteColor: 'purple',
  },
  {
    id: 5,
    name: 'Lumière Silk',
    code: 'KHÔ-SILK-05',
    collection: 'MIKADO PURISM',
    image: card3Lumiere,
    location: 'Tủ Treo B1 - Kệ 02',
    rfid: 'RFID: #RF-1904-B1',
    conditionType: 'humidity',
    conditionText: 'Kho Chống Ẩm Cao Cấp',
    description: 'Lụa Mikado Ý mật độ cao, cổ thuyền vát sâu',
    sizes: [
      { label: 'Size S: 03' },
      { label: 'Size M: 02' },
    ],
    totalUnits: 'Tổng: 05 bộ',
    statusText: 'ĐẠT CHUẨN LƯU KHO',
    statusType: 'stored',
    inspectDate: '15/10/2025',
    inspector: 'Bởi: Bích Ngọc',
    inspectNote: 'Độ bóng hoàn hảo',
    inspectNoteColor: 'green',
  },
  {
    id: 6,
    name: 'Seraphina',
    code: 'KHÔ-CRYS-06',
    collection: 'HERITAGE DIAMOND',
    image: card6Seraphina,
    location: 'Tủ Treo VIP-01 (Két Bảo Vệ)',
    rfid: 'RFID: #RF-9988-VIP',
    conditionType: 'diamond',
    conditionText: 'Kho Kim Hoàn & Đính Kết',
    description: '3.200 viên pha lê Swarovski kết tay đa diện',
    sizes: [
      { label: 'Size S: 01' },
    ],
    totalUnits: 'Tổng: 01 bộ',
    statusText: 'SẴN SÀNG XUẤT GIAO',
    statusType: 'ready',
    inspectDate: '18/10/2025',
    inspector: 'Bởi: Bích Ngọc',
    inspectNote: 'Đủ 3.200 hạt pha lê',
    inspectNoteColor: 'green',
  },
];

export default function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Tình Trạng' },
    { value: 'stored', label: 'Đạt chuẩn lưu kho' },
    { value: 'ready', label: 'Sẵn sàng xuất giao' },
    { value: 'drying', label: 'Giặt sấy nhiệt thấp' },
    { value: 'pending', label: 'Chờ kiểm định sau thuê' },
  ];

  const filteredItems = useMemo(() => {
    return INVENTORY_ITEMS.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || item.statusType === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchTerm, statusFilter]);

  const selectedFilterLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label ||
    'Tất Cả Tình Trạng';

  return (
    <AdminLayout activeMenu="inventory">
      {/* Page Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#B8737D] mb-3" />
          <h1 className="font-playfair text-[36px] md:text-[42px] font-normal text-[#5F2B36] tracking-tight mb-2">
            Quản Lý Kho Hàng
          </h1>
          <p className="text-[14px] text-[#7A6B6C] font-normal leading-relaxed max-w-4xl">
            Hệ thống giám sát kiểm định phom dáng, điều phối tủ treo bảo quản lạnh/chống ẩm vi khí hậu chuyên dụng, theo dõi lịch sử giặt hấp phục hồi xơ sợi tơ tằm và kiểm kê vật tư hạt cườm, pha lê thủ công.
          </p>
        </div>

        {/* Nhập kho mới button */}
        <div className="pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#733F49] hover:bg-[#5C3038] text-white text-[12.5px] font-bold tracking-wider uppercase shadow-xs transition-colors"
          >
            <Plus size={16} />
            <span>NHẬP KHO MỚI</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* Card 1 */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FCDCE1_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                TỔNG LỄ PHỤC TRONG KHO
              </span>
              <div className="w-11 h-11 rounded-2xl bg-[#FDECEE] flex items-center justify-center text-[#B8737D]">
                <HangerIcon size={20} strokeWidth={1.8} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] font-bold text-[#2C2523] leading-none">
                142
              </span>
              <span className="text-[13px] font-medium text-[#8C7D7E] ml-2">
                bộ váy
              </span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-[12px] text-[#1E8347] font-medium">
            <span>↑ +8 bộ vừa hoàn tất giặt hấp chuyên sâu</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#DEF5E7_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                SẴN SÀNG XUẤT GIAO
              </span>
              <div className="w-11 h-11 rounded-2xl bg-[#EAF7EE] flex items-center justify-center text-[#229A53]">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] font-bold text-[#2C2523] leading-none">
                98
              </span>
              <span className="text-[13px] font-medium text-[#8C7D7E] ml-2">
                thiết kế (69%)
              </span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-[12px] text-[#6A5B5C]">
            <Check size={14} className="text-[#229A53]" />
            <span>Đạt chuẩn vệ sinh tơ tằm & hấp phom</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FEEBD0_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                ĐANG BẢO DƯỠNG / GIẶT HẤP
              </span>
              <div className="w-11 h-11 rounded-2xl bg-[#FEF2E6] flex items-center justify-center text-[#D97706]">
                <HangerIcon size={20} strokeWidth={1.8} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] font-bold text-[#2C2523] leading-none">
                19
              </span>
              <span className="text-[13px] font-medium text-[#8C7D7E] ml-2">
                bộ đang xử lý
              </span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-[12px] text-[#6A5B5C]">
            <Clock size={14} className="text-[#D97706]" />
            <span>Cần xử lý hạt pha lê & tà voan</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FCDFD9_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                CẢNH BÁO TỒN KHO
              </span>
              <div className="w-11 h-11 rounded-2xl bg-[#FDECEE] flex items-center justify-center text-[#D03B3B]">
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] font-bold text-[#D03B3B] leading-none">
                05
              </span>
              <span className="text-[13px] font-medium text-[#8C7D7E] ml-2">
                mẫu cần bổ sung
              </span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1 text-[12px] text-[#C93B3B] font-medium">
            <span>! Size phổ biến S, M dưới mức tối thiểu</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Card Container */}
      <div className="bg-white rounded-2xl border border-[#EFE5E1] p-4 shadow-xs mb-4">
        {/* Search Input Bar (Full Width inside card) */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A8B8C]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã váy, tên thiết kế, vị trí..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FFF6F3] border border-[#F4E8E3] focus:border-[#B8737D] focus:bg-white text-[13.5px] text-[#2C2523] placeholder-[#A39293] outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A39293] hover:text-[#5F333B]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown Filter Right Aligned inside card */}
        <div className="flex justify-end mt-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center justify-between gap-3 px-4 py-2 rounded-lg bg-[#FAF2EE] border border-[#EFE2DC] text-[12.5px] text-[#554748] font-medium hover:bg-[#F3E7E2] transition-colors"
            >
              <span>{selectedFilterLabel}</span>
              <ChevronDown
                size={14}
                className={`text-[#8C7D7E] transition-transform ${
                  filterDropdownOpen ? 'rotate-180' : ''
                }`}
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
                    className={`w-full flex items-center justify-between px-4 py-2 text-left text-[13px] transition-colors ${
                      statusFilter === opt.value
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

        {/* Climate / Điều Kiện Kho Pill Badges Row (Bên trong Card nền trắng) */}
        <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] mt-4 pt-1">
          <span className="font-bold text-[#3C3133] tracking-wider uppercase text-[12px] mr-1">
            ĐIỀU KIỆN KHO:
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F5EBE6] text-[#3A2E30] font-medium text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            Nhiệt độ tiêu chuẩn 18°C – 21°C
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F5EBE6] text-[#3A2E30] font-medium text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            Độ ẩm kiểm soát 45% – 50%
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F5EBE6] text-[#3A2E30] font-medium text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            Khử khuẩn Ion Âm Active
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left border-collapse">
            <thead>
              <tr className="border-b border-[#F2E5E0] bg-[#FFF6F3]">
                <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase w-[22%] whitespace-nowrap">
                  SẢN PHẨM
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase w-[30%] whitespace-nowrap">
                  VỊ TRÍ KHO & KỆ TREO
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center w-[15%] whitespace-nowrap">
                  PHÂN LOẠI & TỒN SIZE
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center w-[15%] whitespace-nowrap">
                  TÌNH TRẠNG
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase w-[12%] whitespace-nowrap">
                  LẦN KIỂM KÊ
                </th>
                <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center w-[4%] whitespace-nowrap">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6EDE9]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8C7D7E] text-sm">
                    Không tìm thấy sản phẩm kho nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FCF9F7] transition-colors"
                    >
                      {/* Col 1: Sản phẩm */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-xl object-cover border border-[#EFE5E1] shadow-2xs shrink-0 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setSelectedItem(item)}
                          />
                          <div className="flex flex-col gap-1 items-start">
                            <div
                              onClick={() => setSelectedItem(item)}
                              className="font-playfair text-[15.5px] font-bold text-[#2C2523] hover:text-[#B8737D] cursor-pointer transition-colors leading-tight"
                            >
                              {item.name}
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#F6EDE8] text-[#846E63] font-mono text-[10.5px] font-semibold leading-none">
                              {item.code}
                            </span>
                            <div className="text-[10px] font-bold text-[#A39293] tracking-wider uppercase leading-none">
                              {item.collection}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Vị trí kho & Kệ treo */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 mb-1 whitespace-nowrap">
                          <ShelvesIcon size={16} className="text-[#8A4650] shrink-0" />
                          <span className="font-bold text-[#2C2523] text-[13px] whitespace-nowrap">
                            {item.location}
                          </span>
                          <span className="px-1.5 py-0.5 rounded border border-[#E8DCD7] text-[#8C7D7E] font-mono text-[10px] whitespace-nowrap shrink-0">
                            {item.rfid}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11.5px] font-semibold mb-0.5 whitespace-nowrap">
                          {item.conditionType === 'cold' && (
                            <>
                              <Snowflake size={13} className="text-[#2563EB]" />
                              <span className="text-[#2563EB]">{item.conditionText}</span>
                            </>
                          )}
                          {item.conditionType === 'humidity' && (
                            <>
                              <Droplets size={13} className="text-[#0284C7]" />
                              <span className="text-[#0284C7]">{item.conditionText}</span>
                            </>
                          )}
                          {item.conditionType === 'restore' && (
                            <>
                              <Wrench size={13} className="text-[#D97706]" />
                              <span className="text-[#D97706]">{item.conditionText}</span>
                            </>
                          )}
                          {item.conditionType === 'diamond' && (
                            <>
                              <Gem size={13} className="text-[#D97706]" />
                              <span className="text-[#D97706]">{item.conditionText}</span>
                            </>
                          )}
                        </div>
                        <div className="text-[11.5px] text-[#8A797A]">
                          {item.description}
                        </div>
                      </td>

                      {/* Col 3: Phân loại & Tồn size (Căn giữa) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1 mb-1">
                          {item.sizes.map((s, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2.5 py-0.5 rounded bg-[#FBEBE7] text-[#8A4650] font-semibold text-[11px] text-center"
                            >
                              {s.label}
                            </span>
                          ))}
                          {item.outOfStockSize && (
                            <span className="text-[11px] font-semibold text-[#D03B3B] text-center">
                              {item.outOfStockSize}
                            </span>
                          )}
                        </div>
                        {item.totalUnits && (
                          <div className="text-[11px] text-[#8C7D7E] text-center">
                            {item.totalUnits}
                          </div>
                        )}
                      </td>

                      {/* Col 4: Tình trạng (Capsule badge nằm ngang) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {item.statusType === 'stored' && (
                          <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase whitespace-nowrap bg-[#EAF8EE] text-[#1E8347]">
                            Đạt Chuẩn Lưu Kho
                          </span>
                        )}
                        {item.statusType === 'ready' && (
                          <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase whitespace-nowrap bg-[#FEF3E8] text-[#D97706]">
                            Sẵn Sàng Xuất Giao
                          </span>
                        )}
                        {item.statusType === 'drying' && (
                          <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase whitespace-nowrap bg-[#FFF4E6] text-[#C05621]">
                            Giặt Sấy Nhiệt Thấp
                          </span>
                        )}
                        {item.statusType === 'pending' && (
                          <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase whitespace-nowrap bg-[#F5EEFA] text-[#7E3AF2]">
                            Chờ Kiểm Định Sau Thuê
                          </span>
                        )}
                      </td>

                      {/* Col 5: Lần kiểm kê */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#2C2523] text-[12.5px] leading-tight whitespace-nowrap">
                          {item.inspectDate}
                        </div>
                        <div className="text-[11px] text-[#8C7D7E] mt-0.5 whitespace-nowrap">
                          {item.inspector}
                        </div>
                        <div
                          className={`text-[11.5px] font-semibold mt-0.5 whitespace-nowrap ${
                            item.inspectNoteColor === 'green'
                              ? 'text-[#1E8347]'
                              : item.inspectNoteColor === 'orange'
                              ? 'text-[#C05621]'
                              : 'text-[#7E3AF2]'
                          }`}
                        >
                          {item.inspectNote}
                        </div>
                      </td>

                      {/* Col 6: Thao tác */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div className="relative inline-flex items-center justify-center gap-2 text-[#736364]">
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Đã ghi nhận kiểm kê định kỳ cho: ${item.name}`);
                            }}
                            title="Xác nhận kiểm kê"
                            className="p-1.5 rounded-lg hover:bg-[#F3E7E3] hover:text-[#733F49] transition-colors"
                          >
                            <ClipboardCheck size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuOpenId(
                                actionMenuOpenId === item.id ? null : item.id
                              )
                            }
                            title="Thao tác khác"
                            className="p-1.5 rounded-lg hover:bg-[#F3E7E3] hover:text-[#733F49] transition-colors"
                          >
                            <MoreVertical size={17} />
                          </button>

                          {/* Action Popover Menu */}
                          {actionMenuOpenId === item.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#EFE5E1] py-1.5 z-30 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full px-3.5 py-1.5 text-xs text-[#5F4E50] bg-transparent hover:bg-[#FAF5F2] hover:text-[#733F49] block text-left transition-colors"
                              >
                                Xem hồ sơ bảo quản
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  alert(`Chuyển ${item.name} sang buồng giặt hấp sinh học.`);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full px-3.5 py-1.5 text-xs text-[#5F4E50] bg-transparent hover:bg-[#FAF5F2] hover:text-[#733F49] block text-left transition-colors"
                              >
                                Yêu cầu hấp phom / giặt
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  alert(`Đã kích hoạt quét RFID vị trí: ${item.location}`);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full px-3.5 py-1.5 text-xs text-[#5F4E50] bg-transparent hover:bg-[#FAF5F2] hover:text-[#733F49] block text-left transition-colors"
                              >
                                Hiệu chuẩn thẻ RFID
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

        {/* Footer / Pagination */}
        <div className="py-4 px-6 border-t border-[#F0E6E2] bg-[#FAF2EE] rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 text-[12.5px] text-[#7A6B6C]">
            <span>
              Hiển thị <span className="font-medium text-[#2C2523]">1 - 6</span> trong tổng số{' '}
              <span className="font-medium text-[#2C2523]">142</span> bộ váy cưới & phụ kiện trong kho
            </span>
            <span className="text-[#D4C5C0]">|</span>
            <button
              type="button"
              onClick={() => alert('Đang xuất file Excel kiểm kê kho hàng cao cấp UniBridal...')}
              className="inline-flex items-center gap-1.5 text-[#7A6B6C] hover:text-[#733F49] font-medium transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              <Download size={14} className="stroke-[1.8]" />
              <span>Xuất Bảng Kiểm Kê (Excel/PDF)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[13px]">
            <button
              type="button"
              disabled={activePage === 1}
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setActivePage(1)}
              className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-colors ${
                activePage === 1
                  ? 'bg-[#78434D] text-white shadow-xs'
                  : 'bg-white border border-[#EFE5E1] shadow-2xs text-[#4A3B3D] hover:bg-[#F5ECE8]'
              }`}
            >
              1
            </button>
            <button
              type="button"
              onClick={() => setActivePage(2)}
              className={`w-8 h-8 rounded-lg font-medium flex items-center justify-center transition-colors ${
                activePage === 2
                  ? 'bg-[#78434D] text-white shadow-xs'
                  : 'bg-white border border-[#EFE5E1] shadow-2xs text-[#4A3B3D] hover:bg-[#F5ECE8]'
              }`}
            >
              2
            </button>
            <button
              type="button"
              onClick={() => setActivePage(3)}
              className={`w-8 h-8 rounded-lg font-medium flex items-center justify-center transition-colors ${
                activePage === 3
                  ? 'bg-[#78434D] text-white shadow-xs'
                  : 'bg-white border border-[#EFE5E1] shadow-2xs text-[#4A3B3D] hover:bg-[#F5ECE8]'
              }`}
            >
              3
            </button>
            <span className="px-1 text-[#8C7D7E] text-xs font-semibold">...</span>
            <button
              type="button"
              onClick={() => setActivePage(15)}
              className={`w-8 h-8 rounded-lg font-medium flex items-center justify-center transition-colors ${
                activePage === 15
                  ? 'bg-[#78434D] text-white shadow-xs'
                  : 'bg-white border border-[#EFE5E1] shadow-2xs text-[#4A3B3D] hover:bg-[#F5ECE8]'
              }`}
            >
              15
            </button>
            <button
              type="button"
              onClick={() => setActivePage((p) => Math.min(15, p + 1))}
              className="w-8 h-8 rounded-lg bg-white border border-[#EFE5E1] shadow-2xs flex items-center justify-center text-[#7A6B6C] hover:bg-[#F5ECE8] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Details / Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl lg:max-w-3xl w-full overflow-hidden shadow-2xl border border-[#EFE5E1] flex flex-col sm:flex-row relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#FAF2EE] text-[#7A6B6C] hover:bg-[#F2E3DC] hover:text-[#733F49] flex items-center justify-center transition-colors z-20 border-0 cursor-pointer shadow-2xs"
              title="Đóng cửa sổ"
            >
              <X size={16} />
            </button>

            {/* Left: Image Panel */}
            <div className="w-full sm:w-[42%] lg:w-[45%] relative bg-[#FAF5F2] shrink-0 overflow-hidden min-h-[260px] sm:min-h-[380px]">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="w-full h-full object-cover absolute inset-0"
              />
              <div className="absolute bottom-3.5 left-3.5 px-2.5 py-1 rounded-lg bg-[#733F49]/90 backdrop-blur-xs text-white text-[11px] font-mono font-bold tracking-wider shadow-xs">
                {selectedItem.code}
              </div>
            </div>

            {/* Right: Information Panel */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-[22px] sm:text-[24px] font-bold text-[#68353E] mb-1 pr-6 leading-tight">
                  {selectedItem.name}
                </h3>
                <p className="text-xs text-[#8A797A] mb-4">
                  {selectedItem.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF5F2] border border-[#F0E6E2]">
                    <span className="text-[#8C7D7E] block mb-1">Vị trí lưu kho:</span>
                    <div className="font-semibold text-[#2C2523]">
                      {selectedItem.location}
                    </div>
                    <div className="text-[10.5px] text-[#8C7D7E] mt-0.5 font-mono">
                      {selectedItem.rfid}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF5F2] border border-[#F0E6E2]">
                    <span className="text-[#8C7D7E] block mb-1">Môi trường bảo quản:</span>
                    <div className="font-semibold text-[#2563EB]">
                      {selectedItem.conditionText}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF5F2] border border-[#F0E6E2] mb-5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[#8C7D7E] block">Tình trạng kiểm kê:</span>
                    <span className="font-semibold text-[#1E8347]">
                      {selectedItem.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8C7D7E] block">Thời gian kiểm định:</span>
                    <span className="font-semibold text-[#2C2523]">
                      {selectedItem.lastCheck}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EFE5E1] text-xs font-bold text-[#5F4E50] hover:bg-[#FAF5F2] transition-colors bg-transparent cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Đã hoàn tất kiểm định cho ${selectedItem.name}!`);
                    setSelectedItem(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#733F49] text-xs font-bold text-white hover:bg-[#5C3038] shadow-xs transition-colors border-0 cursor-pointer"
                >
                  Hoàn Tất Kiểm Định
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập Kho Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#EFE5E1]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0E6E2]">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-[#733F49]" />
                <h3 className="font-playfair text-xl font-bold text-[#68353E]">
                  Nhập Kho Lễ Phục Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#9A8B8C] hover:text-[#5F333B]"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Đã tạo phiếu nhập kho thành công và cấp mã RFID!');
                setIsAddModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#5F4E50] mb-1">
                  Tên Tác Phẩm / Mẫu Váy
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Juliette Royal Velvet"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Vị Trí Tủ Treo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Tủ Treo A2 - Kệ 01"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5F4E50] mb-1">
                    Mã RFID Định Danh
                  </label>
                  <input
                    type="text"
                    placeholder="VD: #RF-5512-A2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5F4E50] mb-1">
                  Chế Độ Vi Khí Hậu Bảo Quản
                </label>
                <select className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF5F2] border border-[#EFE5E1] text-[#2C2523] outline-none focus:border-[#B8737D]">
                  <option>Kho Lạnh Tơ Tằm (18°C – 20°C)</option>
                  <option>Kho Chống Ẩm Cao Cấp (45% – 50%)</option>
                  <option>Bảo Dưỡng Phục Hồi Riêng</option>
                  <option>Kho Kim Hoàn & Đính Kết VIP</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EFE5E1] font-bold text-[#5F4E50] hover:bg-[#FAF5F2]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#733F49] font-bold text-white hover:bg-[#5C3038] shadow-xs"
                >
                  Xác Nhận Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
