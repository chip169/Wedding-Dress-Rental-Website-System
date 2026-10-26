import React, { useState, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  Search,
  ChevronDown,
  Eye,
  SlidersHorizontal,
  MoreVertical,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  CalendarDays,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  Check,
  Download
} from 'lucide-react';
import HangerIcon from '../../components/common/HangerIcon';

import card1Elysian from '../../assets/card1_elysian.jpg';
import card2Celeste from '../../assets/card2_celeste.jpg';
import card3Lumiere from '../../assets/card3_lumiere.jpg';
import card4Monet from '../../assets/card4_monet.jpg';
import card5Aurora from '../../assets/card5_aurora.jpg';
import card6Seraphina from '../../assets/card6_seraphina.jpg';

const INITIAL_DRESSES = [
  {
    id: 1,
    name: 'Elysian Rose Ballgown',
    code: '#UB - GOWN - 001',
    material: 'Tulle Ý, Ren Chantilly Pháp',
    image: card1Elysian,
    size: 'Size S',
    v1: '84 cm',
    v2: '62 cm',
    v3: '90 cm',
    totalPrice: '20.200.000₫',
    priceDetail: '(Thuê: 5.200.000₫ + Cọc: 15.000.000₫)',
    status: 'Sẵn sàng cho thuê',
    statusType: 'available', // available | handover | maintenance
    scheduleTitle: '2 lịch thử hôm nay',
    returnDate: '25/11/2024',
  },
  {
    id: 2,
    name: 'Celeste Royal Mermaid',
    code: '#UB - GOWN - 002',
    material: 'Ren Alençon, Hạt pha lê đính nổi',
    image: card2Celeste,
    size: 'Size M',
    v1: '88 cm',
    v2: '66 cm',
    v3: '94 cm',
    totalPrice: '24.500.000₫',
    priceDetail: '(Thuê: 6.500.000₫ + Cọc: 18.000.000₫)',
    status: 'Đang bàn giao',
    statusType: 'handover',
    scheduleTitle: 'Bàn giao ngày 19/11',
    returnDate: '22/11/2024',
  },
  {
    id: 3,
    name: 'Lumière Minimal Silk',
    code: '#UB - GOWN - 003',
    material: 'Lụa Mikado Nhật Bản dệt mờ',
    image: card3Lumiere,
    size: 'Size S/M',
    v1: '86 cm',
    v2: '64 cm',
    v3: '92 cm',
    totalPrice: '15.800.000₫',
    priceDetail: '(Thuê: 3.800.000₫ + Cọc: 12.000.000₫)',
    status: 'Sẵn sàng cho thuê',
    statusType: 'available',
    scheduleTitle: 'Trống lịch tuần này',
    returnDate: '26/11/2024',
  },
  {
    id: 4,
    name: 'Monet 3D Floral Couture',
    code: '#UB - GOWN - 004',
    material: 'Hoa thêu nổi 3D Organza thủ công',
    image: card4Monet,
    size: 'Size S',
    v1: '82 cm',
    v2: '60 cm',
    v3: '88 cm',
    totalPrice: '32.800.000₫',
    priceDetail: '(Thuê: 7.800.000₫ + Cọc: 25.000.000₫)',
    status: 'Bảo dưỡng',
    statusType: 'maintenance',
    scheduleTitle: 'Phục hồi ren tơ tằm',
    scheduleSpecial: true,
    returnDate: '27/11/2024',
  },
  {
    id: 5,
    name: 'Aurora Pearl Sheath',
    code: '#UB - GOWN - 005',
    material: 'Crepe lụa cát dệt tay, ngọc trai tự nhiên',
    image: card5Aurora,
    size: 'Size M',
    v1: '86 cm',
    v2: '68 cm',
    v3: '93 cm',
    totalPrice: '18.500.000₫',
    priceDetail: '(Thuê: 4.500.000₫ + Cọc: 14.000.000₫)',
    status: 'Sẵn sàng cho thuê',
    statusType: 'available',
    scheduleTitle: 'Thuê ngày 24/11',
    returnDate: '27/11/2024',
  },
  {
    id: 6,
    name: 'Seraphina Crystal Princess',
    code: '#UB - GOWN - 006',
    material: 'Đính 8.000 hạt pha lê Swarovski',
    image: card6Seraphina,
    size: 'Size L',
    v1: '92 cm',
    v2: '74 cm',
    v3: '98 cm',
    totalPrice: '39.200.000₫',
    priceDetail: '(Thuê: 9.200.000₫ + Cọc: 30.000.000₫)',
    status: 'Đang bàn giao',
    statusType: 'handover',
    scheduleTitle: 'Thuê tại Đà Nẵng',
    returnDate: '28/11/2024',
  },
];

export default function OrderRentalManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [selectedDress, setSelectedDress] = useState(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'Tất Cả Tình Trạng' },
    { value: 'available', label: 'Sẵn sàng cho thuê' },
    { value: 'handover', label: 'Đang bàn giao' },
    { value: 'maintenance', label: 'Bảo dưỡng' },
  ];

  // Filter dresses based on search & status
  const filteredDresses = useMemo(() => {
    return INITIAL_DRESSES.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.material.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || item.statusType === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchTerm, statusFilter]);

  const selectedFilterLabel =
    statusOptions.find((opt) => opt.value === statusFilter)?.label ||
    'Tất Cả Tình Trạng';

  return (
    <AdminLayout activeMenu="don-thue">
      {/* Decorative dot & Header title */}
      <div className="mb-8">
        <div className="w-2.5 h-2.5 rounded-full bg-[#B8737D] mb-3" />
        <h1 className="font-playfair text-[36px] md:text-[42px] font-normal text-[#5F2B36] tracking-tight mb-2">
          Quản Lý Đơn Thuê
        </h1>
        <p className="text-[14px] text-[#7A6B6C] font-normal leading-relaxed max-w-4xl">
          Danh mục váy cưới UniBridal, định danh số đo, quản lý vòng đời cho thuê và lịch bảo dưỡng xơ sợi tơ tằm thủ công.
        </p>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* Card 1 */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FCDCE1_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                TỔNG BỘ SƯU TẬP
              </span>
              <div className="w-11 h-11 rounded-2xl bg-[#F4EDE6] flex items-center justify-center text-[#8C6D62]">
                <HangerIcon size={20} strokeWidth={1.8} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] font-bold text-[#2C2523] leading-none">
                86
              </span>
              <span className="text-[13px] font-medium text-[#8C7D7E] ml-2">
                mẫu
              </span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-[12px] text-[#7A6B6C]">
            <Plus size={14} className="text-[#8C6D62]" />
            <span>4 mẫu mới từ BST Thu Đông</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#DEF5E7_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                SẴN SÀNG CHO THUÊ
              </span>
              <div className="w-11 h-11 rounded-2xl bg-[#EAF7EE] flex items-center justify-center text-[#229A53]">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] font-bold text-[#1E8347] leading-none">
                52
              </span>
              <span className="text-[13px] font-medium text-[#8C7D7E] ml-2">
                mẫu
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px] text-[#7A6B6C] mb-1.5">
              <span>Tỷ lệ sẵn sàng</span>
              <span className="font-bold text-[#2C2523]">60.5%</span>
            </div>
            <div className="w-full h-1.5 bg-[#F4EBE6] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#247A3B] rounded-full transition-all duration-500"
                style={{ width: '60.5%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FEEBD0_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                ĐANG THUÊ / GIỮ CHỖ
              </span>
              <div className="w-11 h-11 rounded-2xl bg-[#FEF2E6] flex items-center justify-center text-[#D97706]">
                <CalendarDays size={20} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] font-bold text-[#B46A29] leading-none">
                22
              </span>
              <span className="text-[13px] font-medium text-[#8C7D7E] ml-2">
                mẫu
              </span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-[12px] text-[#7A6B6C]">
            <Calendar size={14} className="text-[#D97706]" />
            <span>Lịch thử kín 100%tuần này</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white bg-[radial-gradient(ellipse_at_top_right,_#FCDFD9_0%,_transparent_70%)] rounded-2xl border border-[#EFE5E1] p-5 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-[1.2px] text-[#736364] uppercase">
                BẢO TRÌ / GIẶT HẤP PHOM
              </span>
              <div className="w-11 h-11 rounded-2xl bg-[#FDECEE] flex items-center justify-center text-[#B8737D]">
                <HangerIcon size={20} strokeWidth={1.8} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-[34px] font-bold text-[#A84A58] leading-none">
                12
              </span>
              <span className="text-[13px] font-medium text-[#8C7D7E] ml-2">
                mẫu
              </span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-[12px] text-[#7A6B6C]">
            <Clock size={14} className="text-[#B8737D]" />
            <span>3 mẫu cần kiểm định</span>
          </div>
        </div>
      </div>

      {/* Search Bar + Filter inside white Card Container */}
      <div className="bg-white rounded-2xl border border-[#EFE5E1] p-4 shadow-xs mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A8B8C]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã váy, tên thiết kế,..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FFF6F3] border border-[#EFE2DC] focus:border-[#B8737D] focus:bg-white text-[13.5px] text-[#2C2523] placeholder-[#A39293] outline-none transition-all"
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
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-[#F2E5E0] bg-[#FFF6F3]">
                <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase">
                  TÁC PHẨM & MÃ THIẾT KẾ
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center">
                  SIZE & SỐ ĐO<br />
                  <span className="text-[10px] text-[#9E8B8C] font-normal">(V1 - V2 - V3)</span>
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center">
                  GIÁ & TỔNG TIỀN THUÊ
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center">
                  TÌNH TRẠNG KHO
                </th>
                <th className="py-4 px-4 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-center">
                  LỊCH HẸN / KẾ HOẠCH
                </th>
                <th className="py-4 px-5 text-[11px] font-bold tracking-[1px] text-[#7A696B] uppercase text-right">
                  THAO TÁC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6EDE9]">
              {filteredDresses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8C7D7E] text-sm">
                    Không tìm thấy mẫu váy cưới nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredDresses.map((dress) => {
                  return (
                    <tr
                      key={dress.id}
                      className="hover:bg-[#FCF9F7] transition-colors"
                    >
                      {/* Col 1: Tác phẩm & Mã */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={dress.image}
                            alt={dress.name}
                            className="w-14 h-14 rounded-xl object-cover border border-[#EFE5E1] shadow-2xs shrink-0 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setSelectedDress(dress)}
                          />
                          <div>
                            <div
                              onClick={() => setSelectedDress(dress)}
                              className="font-playfair text-[15.5px] font-bold text-[#2C2523] hover:text-[#B8737D] cursor-pointer transition-colors leading-tight mb-1"
                            >
                              {dress.name}
                            </div>
                            <div className="inline-block px-1.5 py-0.5 rounded bg-[#F6EDE8] text-[#846E63] font-mono text-[10.5px] font-semibold tracking-wider mb-1">
                              {dress.code}
                            </div>
                            <div className="text-[11.5px] text-[#8A797A]">
                              {dress.material}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Size & Số đo (Căn giữa theo cột) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center">
                          <div className="inline-block px-2.5 py-0.5 rounded-md bg-[#FCECE8] text-[#B8737D] text-[11px] font-bold mb-1.5 text-center">
                            {dress.size}
                          </div>
                          <div className="text-[12px] text-[#554748] space-y-0.5 text-left">
                            <div>
                              <span className="text-[#998889] text-[11px]">V1{'\u00A0\u00A0'}:{'\u00A0\u00A0\u00A0'}</span>
                              <span className="font-semibold">{dress.v1}</span>
                            </div>
                            <div>
                              <span className="text-[#998889] text-[11px]">V2{'\u00A0\u00A0'}:{'\u00A0\u00A0\u00A0'}</span>
                              <span className="font-semibold">{dress.v2}</span>
                            </div>
                            <div>
                              <span className="text-[#998889] text-[11px]">V3{'\u00A0\u00A0'}:{'\u00A0\u00A0\u00A0'}</span>
                              <span className="font-semibold">{dress.v3}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Col 3: Giá & Tổng tiền thuê (Căn giữa) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="text-[14.5px] font-bold text-[#863E4B] leading-snug">
                          {dress.totalPrice}
                        </div>
                        {dress.priceDetail && (
                          <div className="text-[11px] text-[#8C7D7E] mt-0.5 leading-tight text-center">
                            {dress.priceDetail.includes('+') ? (
                              <>
                                <div>{dress.priceDetail.split('+')[0].trim()} +</div>
                                <div>{dress.priceDetail.split('+')[1].trim()}</div>
                              </>
                            ) : (
                              dress.priceDetail
                            )}
                          </div>
                        )}
                      </td>

                      {/* Col 4: Tình trạng kho */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {dress.statusType === 'available' && (
                          <span className="inline-block px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-[#EAF8EE] text-[#1E8347] leading-tight text-center">
                            Sẵn sàng<br />cho thuê
                          </span>
                        )}
                        {dress.statusType === 'handover' && (
                          <span className="inline-block px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-[#F9EFE4] text-[#A66929] leading-tight text-center">
                            Đang<br />bàn giao
                          </span>
                        )}
                        {dress.statusType === 'maintenance' && (
                          <span className="inline-block px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-[#FDEAEB] text-[#B84E5D] leading-tight text-center">
                            Bảo<br />dưỡng
                          </span>
                        )}
                      </td>

                      {/* Col 5: Lịch hẹn / Kế hoạch (Căn giữa) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div
                          className={`text-[12px] font-semibold leading-snug whitespace-nowrap ${
                            dress.scheduleSpecial
                              ? 'text-[#B84E5D]'
                              : 'text-[#2C2523]'
                          }`}
                        >
                          {dress.scheduleTitle}
                        </div>
                        <div className="text-[11px] text-[#8C7D7E] mt-1 leading-tight whitespace-nowrap">
                          Dự kiến hoàn trả: {dress.returnDate}
                        </div>
                      </td>

                      {/* Col 6: Thao tác */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="relative inline-flex items-center justify-end gap-2 text-[#736364]">
                          <button
                            type="button"
                            onClick={() => setSelectedDress(dress)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg hover:bg-[#F3E7E3] hover:text-[#733F49] transition-colors"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDress(dress)}
                            title="Chỉnh sửa / Điều phối"
                            className="p-1.5 rounded-lg hover:bg-[#F3E7E3] hover:text-[#733F49] transition-colors"
                          >
                            <SlidersHorizontal size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActionMenuOpenId(
                                actionMenuOpenId === dress.id ? null : dress.id
                              )
                            }
                            title="Thao tác khác"
                            className="p-1.5 rounded-lg hover:bg-[#F3E7E3] hover:text-[#733F49] transition-colors"
                          >
                            <MoreVertical size={17} />
                          </button>

                          {/* Action Popover Menu */}
                          {actionMenuOpenId === dress.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-[#EFE5E1] py-1.5 z-30 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDress(dress);
                                  setActionMenuOpenId(null);
                                }}
                                className="w-full px-3.5 py-1.5 text-xs text-[#5F4E50] bg-transparent hover:bg-[#FAF5F2] hover:text-[#733F49] block text-left transition-colors"
                              >
                                Xem chi tiết tác phẩm
                              </button>
                              <button
                                type="button"
                                onClick={() => setActionMenuOpenId(null)}
                                className="w-full px-3.5 py-1.5 text-xs text-[#5F4E50] bg-transparent hover:bg-[#FAF5F2] hover:text-[#733F49] block text-left transition-colors"
                              >
                                Đổi tình trạng kho
                              </button>
                              <button
                                type="button"
                                onClick={() => setActionMenuOpenId(null)}
                                className="w-full px-3.5 py-1.5 text-xs text-[#5F4E50] bg-transparent hover:bg-[#FAF5F2] hover:text-[#733F49] block text-left transition-colors"
                              >
                                Cập nhật số đo
                              </button>
                              <button
                                type="button"
                                onClick={() => setActionMenuOpenId(null)}
                                className="w-full px-3.5 py-1.5 text-xs text-[#B84E5D] bg-transparent hover:bg-[#FDEAEB] block text-left transition-colors"
                              >
                                Chuyển bảo dưỡng
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
              <span className="font-medium text-[#2C2523]">186</span> hợp đồng
            </span>
            <span className="text-[#D4C5C0]">|</span>
            <button
              type="button"
              onClick={() => alert('Đang xuất danh sách hợp đồng & đơn thuê (Excel/PDF)...')}
              className="inline-flex items-center gap-1.5 text-[#7A6B6C] hover:text-[#733F49] font-medium transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              <Download size={14} className="stroke-[1.8]" />
              <span>Xuất Danh Sách Hợp Đồng (Excel/PDF)</span>
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

      {/* Quick Details Modal */}
      {selectedDress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl lg:max-w-3xl w-full overflow-hidden shadow-2xl border border-[#EFE5E1] flex flex-col sm:flex-row relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedDress(null)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#FAF2EE] text-[#7A6B6C] hover:bg-[#F2E3DC] hover:text-[#733F49] flex items-center justify-center transition-colors z-20 border-0 cursor-pointer shadow-2xs"
              title="Đóng cửa sổ"
            >
              <X size={16} />
            </button>

            {/* Left: Image Panel */}
            <div className="w-full sm:w-[42%] lg:w-[45%] relative bg-[#FAF5F2] shrink-0 overflow-hidden min-h-[260px] sm:min-h-[380px]">
              <img
                src={selectedDress.image}
                alt={selectedDress.name}
                className="w-full h-full object-cover absolute inset-0"
              />
              <div className="absolute bottom-3.5 left-3.5 px-2.5 py-1 rounded-lg bg-[#733F49]/90 backdrop-blur-xs text-white text-[11px] font-mono font-bold tracking-wider shadow-xs">
                {selectedDress.code}
              </div>
            </div>

            {/* Right: Information Panel */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-[22px] sm:text-[24px] font-bold text-[#68353E] mb-1 pr-6 leading-tight">
                  {selectedDress.name}
                </h3>
                <p className="text-xs text-[#8A797A] mb-4">
                  {selectedDress.material}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAF5F2] border border-[#F0E6E2]">
                    <span className="text-[#8C7D7E] block mb-1">Số đo định danh:</span>
                    <div className="font-semibold text-[#2C2523] space-y-0.5">
                      <div>Ngực (V1): {selectedDress.v1}</div>
                      <div>Eo (V2): {selectedDress.v2}</div>
                      <div>Mông (V3): {selectedDress.v3}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF5F2] border border-[#F0E6E2]">
                    <span className="text-[#8C7D7E] block mb-1">Tài chính đơn thuê:</span>
                    <div className="font-bold text-[#863E4B] text-[14px]">
                      {selectedDress.totalPrice}
                    </div>
                    <div className="text-[10.5px] text-[#8C7D7E] mt-0.5 leading-tight">
                      {selectedDress.priceDetail && selectedDress.priceDetail.includes('+') ? (
                        <>
                          <div>{selectedDress.priceDetail.split('+')[0].trim()} +</div>
                          <div>{selectedDress.priceDetail.split('+')[1].trim()}</div>
                        </>
                      ) : (
                        selectedDress.priceDetail
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF5F2] border border-[#F0E6E2] mb-5 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[#8C7D7E] block">Kế hoạch sử dụng:</span>
                    <span className="font-semibold text-[#2C2523]">
                      {selectedDress.scheduleTitle}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8C7D7E] block">Hạn trả dự kiến:</span>
                    <span className="font-semibold text-[#2C2523]">
                      {selectedDress.returnDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDress(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#EFE5E1] text-xs font-bold text-[#5F4E50] hover:bg-[#FAF5F2] transition-colors bg-transparent cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Đã cập nhật yêu cầu điều phối cho ${selectedDress.name}!`);
                    setSelectedDress(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#733F49] text-xs font-bold text-white hover:bg-[#5C3038] shadow-xs transition-colors border-0 cursor-pointer"
                >
                  Cập Nhật Tiến Độ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
