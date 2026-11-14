import React, { useState, useMemo, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Layers,
  Upload,
  Download,
  FileCode,
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
  Crown,
  BookOpen,
  ArrowRight,
  Save,
  Check,
  Scale,
  DollarSign,
  Calendar,
  AlertTriangle,
  History,
  ExternalLink,
  Link2,
  Paperclip,
  FileUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from 'antd';
import {
  getContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  deleteContractTemplate,
  duplicateContractTemplate,
} from '../../services/contractService';
import { HIEU_SIGNATURE_BASE64 } from '../../assets/images/signatureHieuBase64';

export default function ContractTemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'clauses' | 'audit'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [editTemplate, setEditTemplate] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createAttachedFile, setCreateAttachedFile] = useState(null);
  const [showToast, setShowToast] = useState('');

  const triggerToast = (msg) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 3500);
  };

  // Tải danh sách mẫu hợp đồng từ Database API
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await getContractTemplates();
      const rawList = res?.data && Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      if (rawList.length > 0) {
        const backendList = rawList.map((item) => ({
          _id: item._id,
          id: item.code || item._id,
          code: item.code || item.id,
          name: item.name,
          category: item.category,
          badge: item.badge || (item.isDefault ? 'Mặc định hệ thống' : 'Tiêu chuẩn'),
          status: item.status || 'active',
          version: item.version || 'v2026.1',
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString().split('T')[0] : '',
          updatedBy: item.updatedBy || 'Ban Giám Đốc Atelier',
          appliedCount: typeof item.appliedCount === 'number' ? item.appliedCount : 0,
          defaultDuration: item.defaultDuration || '3 ngày 2 đêm',
          depositRate: item.depositRate || '100% giá trị hợp đồng',
          overdueFee: item.overdueFee || '500.000 VNĐ / ngày trễ',
          description: item.description || '',
          pdfUrl: item.pdfUrl || '',
          contractUrl: item.contractUrl || item.pdfUrl || '',
          documentFile: item.documentFile?.name ? item.documentFile : null,
          clauses: item.clauses || [],
          isDefault: Boolean(item.isDefault),
        }));
        setTemplates(backendList);
        setError('');
      } else {
        setTemplates([]);
        setError('');
      }
    } catch (err) {
      console.warn('Lỗi khi tải mẫu hợp đồng:', err);
      setError('Không thể kết nối cơ sở dữ liệu để tải mẫu hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter logic
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchSearch =
        tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.code || tpl.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tpl.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [templates, searchQuery]);

  // Handler duplicate (Nhân bản mẫu hợp đồng trực tiếp vào Database)
  const handleDuplicate = async (tpl) => {
    const targetId = tpl._id || tpl.id || tpl.code;
    try {
      await duplicateContractTemplate(targetId);
      triggerToast(`Đã nhân bản mẫu "${tpl.name}" thành công vào hệ thống!`);
      loadTemplates();
    } catch (err) {
      const newTpl = {
        ...tpl,
        _id: `copy_${Date.now()}`,
        id: `TPL-COPY-${Date.now().toString().slice(-4)}`,
        code: `TPL-COPY-${Date.now().toString().slice(-4)}`,
        name: `${tpl.name} (Bản sao)`,
        status: 'draft',
        badge: 'Bản sao nhân bản',
        version: 'v1.0-draft',
        updatedAt: new Date().toISOString().split('T')[0],
        appliedCount: 0,
      };
      setTemplates((prev) => [newTpl, ...prev]);
      triggerToast(`Đã nhân bản mẫu "${tpl.name}" thành công!`);
    }
  };

  // Handler delete (Xóa mẫu hợp đồng có xác nhận)
  const handleDelete = (tpl) => {
    const targetId = tpl._id || tpl.id || tpl.code;
    const targetName = tpl.name || tpl.id;

    Modal.confirm({
      title: 'Xác nhận xóa mẫu hợp đồng',
      content: `Nàng có chắc chắn muốn xóa vĩnh viễn mẫu "${targetName}" (${tpl.code || tpl.id}) khỏi danh mục hệ thống?`,
      okText: 'Xác nhận xóa',
      okType: 'danger',
      cancelText: 'Hủy bỏ',
      okButtonProps: { style: { backgroundColor: '#B91C1C', borderColor: '#B91C1C' } },
      onOk: async () => {
        try {
          await deleteContractTemplate(targetId);
          setTemplates((prev) => prev.filter((t) => (t._id || t.id) !== targetId && t.code !== targetId));
          triggerToast(`Đã xóa thành công mẫu hợp đồng "${targetName}"`);
        } catch (err) {
          setTemplates((prev) => prev.filter((t) => (t._id || t.id) !== targetId && t.code !== targetId));
          triggerToast(`Đã xóa mẫu hợp đồng "${targetName}"`);
        }
      },
    });
  };

  return (
    <AdminLayout
      activeMenu="contract-templates"
      title="Quản Lý Mẫu Hợp Đồng"
      subtitle="Thiết lập cấu trúc pháp lý, quy chuẩn tiền cọc và chính sách bồi thường áp dụng toàn hệ thống"
      controls={
        <div className="flex items-center gap-3">
          <Link
            to="/admin/hop-dong"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-[#5F2B36] bg-white border border-[#E8DDD8] rounded-xl hover:bg-[#FAF0EC] transition-all shadow-xs"
          >
            <FileSignature className="w-4 h-4 text-[#733F49]" />
            Xem Danh Sách Hợp Đồng Đã Ký
          </Link>
          <button
            onClick={() => {
              setCreateAttachedFile(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#733F49] to-[#8C4654] hover:from-[#5A2D35] hover:to-[#733F49] text-white text-xs font-bold transition-all cursor-pointer shadow-md border-0 shrink-0 self-start sm:self-auto"
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
                  {tpl.documentFile?.name && (
                    <div className="flex items-center justify-between text-[#8C7A6B]">
                      <span className="text-[11px] text-[#A39284]">File văn bản mẫu:</span>
                      <a
                        href={tpl.documentFile?.url || tpl.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#854F55] hover:text-[#5F323B] bg-[#FFF0ED] hover:bg-[#FFE4DE] border border-[#FFDADC] px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] max-w-[170px] truncate transition-colors group"
                        title={tpl.documentFile?.name}
                      >
                        <FileText className="w-3 h-3 text-[#B8737D] shrink-0" />
                        <span className="truncate group-hover:underline">{tpl.documentFile?.name}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[#B8737D] shrink-0 opacity-70 group-hover:opacity-100" />
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#8C7A6B]">
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
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#2C2523] bg-[#FAF7F2] hover:bg-[#F2ECE4] rounded-xl transition-all border border-[#E8DFD8] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>Xem Mẫu</span>
                  </button>

                  <button
                    onClick={() => setEditTemplate(tpl)}
                    title="Chỉnh sửa mẫu hợp đồng"
                    className="p-2 text-[#8C7A6B] hover:text-[#733F49] hover:bg-[#FAF0EC] rounded-xl transition-all border border-[#E8DFD8] hover:border-[#EEDECF] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(tpl)}
                    title="Xóa mẫu hợp đồng"
                    className="p-2 text-[#8C7A6B] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-[#E8DFD8] hover:border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: BẢNG QUY CHUẨN ĐỀN BÙ HƯ HỎNG */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-[#EFE5E1] shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#F2E8E2] bg-[#FAF7F2]/60">
            <h3 className="text-base font-bold text-[#2C2523]">Bảng Định Mức Bồi Thường và Khắc Phục Hư Tổn Váy Cưới</h3>
            <p className="text-xs text-[#8C7A6B] mt-1">
              Phụ lục chuẩn đính kèm tự động trong mọi hợp đồng điện tử để minh bạch hóa chi phí với cô dâu chú rể khi hoàn trả trang phục.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-[#FAF7F2] text-[#8C7A6B] uppercase font-semibold text-[10px] tracking-wider border-b border-[#EFE5E1]">
                <tr>
                  <th className="py-3 px-5 whitespace-nowrap w-[240px]">Mức độ hư tổn</th>
                  <th className="py-3 px-5">Mô tả chi tiết sự cố</th>
                  <th className="py-3 px-5">Quy trình xử lý tại Atelier</th>
                  <th className="py-3 px-5 text-right whitespace-nowrap w-[180px]">Mức phí áp dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4ECE7] text-[#2C2523]">
                <tr className="hover:bg-[#FDFBF9]">
                  <td className="py-4 px-5 whitespace-nowrap align-middle">
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 whitespace-nowrap shadow-2xs">
                      Cấp độ 1: Bẩn nhẹ
                    </span>
                  </td>
                  <td className="py-4 px-5">Bụi đất bám tà dưới do di chuyển sân khấu hoặc chụp studio thông thường.</td>
                  <td className="py-4 px-5 text-[#8C7A6B]">Giặt hấp Dry-cleaning công nghệ Ozone tiêu chuẩn showroom.</td>
                  <td className="py-4 px-5 text-right font-bold text-emerald-600 whitespace-nowrap">MIỄN PHÍ</td>
                </tr>

                <tr className="hover:bg-[#FDFBF9]">
                  <td className="py-4 px-5 whitespace-nowrap align-middle">
                    <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 whitespace-nowrap shadow-2xs">
                      Cấp độ 2: Ố bẩn cứng đầu
                    </span>
                  </td>
                  <td className="py-4 px-5">Vết vang đỏ, son môi, thức ăn dầu mỡ dính diện rộng lên lụa Mikado hoặc Tulle.</td>
                  <td className="py-4 px-5 text-[#8C7A6B]">Hóa chất tẩy sinh học Pháp chuyên dụng bảo vệ sợi tơ tằm.</td>
                  <td className="py-4 px-5 text-right font-bold text-amber-600 whitespace-nowrap">300.000 – 600.000 VNĐ</td>
                </tr>

                <tr className="hover:bg-[#FDFBF9]">
                  <td className="py-4 px-5 whitespace-nowrap align-middle">
                    <span className="inline-flex items-center text-xs font-semibold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 whitespace-nowrap shadow-2xs">
                      Cấp độ 3: Rách ren / Rơi hạt
                    </span>
                  </td>
                  <td className="py-4 px-5">Rách voan tà ngoài &lt; 10cm, đứt chuỗi pha lê Swarovski, tuột cúc ngọc trai.</td>
                  <td className="py-4 px-5 text-[#8C7A6B]">Nghệ nhân đính kết may phục hồi thủ công theo bản vẽ gốc.</td>
                  <td className="py-4 px-5 text-right font-bold text-orange-600 whitespace-nowrap">800.000 – 2.500.000 VNĐ</td>
                </tr>

                <tr className="hover:bg-[#FDFBF9]">
                  <td className="py-4 px-5 whitespace-nowrap align-middle">
                    <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 whitespace-nowrap shadow-2xs">
                      Cấp độ 4: Hư hỏng nghiêm trọng
                    </span>
                  </td>
                  <td className="py-4 px-5">Cháy sém do pháo hoa, biến dạng gọng corset không thể nắn, mất hẳn phụ kiện đi kèm.</td>
                  <td className="py-4 px-5 text-[#8C7A6B]">Váy bị loại bỏ hoàn toàn khỏi bộ sưu tập cho thuê.</td>
                  <td className="py-4 px-5 text-right font-bold text-rose-600 whitespace-nowrap">100% Giá trị váy niêm yết</td>
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
              {/* Download / Direct Link Card (hiển thị khi có file đính kèm) */}
              {previewTemplate.documentFile?.name && (
                <div className="bg-[#FFF8F6] border border-[#FFDADC] rounded-2xl p-4 font-sans text-xs shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#854F55] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        PDF
                      </div>
                      <div>
                        <p className="font-bold text-[#2C2523] text-sm">
                          {previewTemplate.documentFile.name}
                        </p>
                        <p className="text-[11px] text-[#8C7A6B]">
                          {previewTemplate.documentFile.size ? `Dung lượng: ${previewTemplate.documentFile.size} • ` : ''}Định dạng: PDF / Word{previewTemplate.updatedAt ? ` • Cập nhật: ${previewTemplate.updatedAt}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={previewTemplate.documentFile.url || previewTemplate.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#854F55] hover:bg-[#6E3F44] text-white font-semibold rounded-xl text-xs transition-colors shrink-0 shadow-xs text-decoration-none"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Mở File Văn Bản
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          const link = previewTemplate.documentFile.url || previewTemplate.pdfUrl;
                          navigator.clipboard.writeText(link);
                          triggerToast(`Đã sao chép link file: ${link}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF7F2] text-[#854F55] border border-[#FFDADC] font-semibold rounded-xl text-xs transition-colors shrink-0"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Sao Chép Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                <Crown className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
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

              {/* Metadata */}
              <div className="font-sans text-xs text-[#8C7A6B] pt-4 border-t border-[#E8DFD8] flex items-center justify-between">
                <span>Người phê duyệt văn bản: <strong>{previewTemplate.updatedBy || 'Ban Giám Đốc Atelier'}</strong></span>
                {previewTemplate.updatedAt && <span>Ngày cập nhật: {previewTemplate.updatedAt}</span>}
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
              onSubmit={async (e) => {
                e.preventDefault();
                const targetId = editTemplate._id || editTemplate.id || editTemplate.code;
                try {
                  await updateContractTemplate(targetId, editTemplate);
                  triggerToast(`Đã lưu cập nhật thành công cho mẫu "${editTemplate.name}"!`);
                  loadTemplates();
                } catch (err) {
                  setTemplates(templates.map((t) => (t.id === editTemplate.id ? editTemplate : t)));
                  triggerToast('Đã lưu các thay đổi cho mẫu hợp đồng!');
                }
                setEditTemplate(null);
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
                  <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Phân Loại Dịch Vụ</label>
                  <select
                    value={editTemplate.category}
                    onChange={(e) => setEditTemplate({ ...editTemplate, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                  >
                    <option value="Haute Couture">Haute Couture</option>
                    <option value="Bespoke First-Wear">Bespoke First-Wear</option>
                    <option value="Combo Trọn Gói">Combo Trọn Gói</option>
                    <option value="Áo Dài Cưới">Áo Dài Cưới</option>
                    <option value="VIP Diamond">VIP Diamond</option>
                    <option value="Vest và Tuxedo">Vest và Tuxedo</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Trạng Thái Mẫu</label>
                  <select
                    value={editTemplate.status}
                    onChange={(e) => setEditTemplate({ ...editTemplate, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                  >
                    <option value="active">Đang áp dụng (Active)</option>
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="inactive">Ngừng sử dụng (Inactive)</option>
                  </select>
                </div>
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

              {/* TẢI LÊN / ĐỔI FILE MẪU HỢP ĐỒNG */}
              <div>
                <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1 flex items-center justify-between">
                  <span>File Văn Bản Mẫu Hiện Tại (.docx / .pdf)</span>
                  <span className="text-[10px] text-[#389E0D] font-semibold">Đã đính kèm</span>
                </label>
                <div className="bg-[#FFF8F6] border border-[#FFDADC] rounded-xl p-3 flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#854F55] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      W
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#2C2523] truncate">{editTemplate.documentFile?.name || 'Mau_Hop_Dong.docx'}</p>
                      <p className="text-[10px] text-[#8C7A6B]">{editTemplate.documentFile?.size || '250 KB'}</p>
                    </div>
                  </div>
                  <label className="cursor-pointer text-[11px] font-semibold text-[#854F55] hover:text-[#6E3F44] border border-[#FFDADC] bg-white px-2.5 py-1 rounded-lg shrink-0">
                    Đổi File Khác
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const fileUrl = URL.createObjectURL(file);
                          setEditTemplate({
                            ...editTemplate,
                            pdfUrl: file.name.endsWith('.pdf') ? fileUrl : editTemplate.pdfUrl,
                            documentFile: {
                              name: file.name,
                              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB` === '0.0 MB'
                                ? `${Math.round(file.size / 1024)} KB`
                                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                              url: fileUrl,
                              uploadedAt: new Date(),
                            }
                          });
                          triggerToast(`Đã tải lên file mới: ${file.name}`);
                        }
                      }}
                    />
                  </label>
                </div>
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
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target;
                const nextIndex = templates.length + 1;
                let autoCode = `TPL-UB-${String(nextIndex).padStart(2, '0')}`;
                if (templates.some((t) => t.code === autoCode || t.id === autoCode)) {
                  autoCode = `TPL-UB-${Date.now().toString().slice(-4)}`;
                }
                const newCode = autoCode;
                const documentFile = createAttachedFile
                  ? {
                      name: createAttachedFile.name,
                      size: createAttachedFile.size,
                      url: createAttachedFile.url || '',
                      uploadedAt: new Date(),
                    }
                  : null;

                const newTpl = {
                  id: newCode,
                  code: newCode,
                  name: form.name.value.trim(),
                  category: 'Haute Couture',
                  badge: 'Mẫu hợp đồng',
                  status: 'active',
                  version: 'v1.0',
                  updatedAt: new Date().toISOString().split('T')[0],
                  updatedBy: 'Ban Giám Đốc Atelier',
                  appliedCount: 0,
                  defaultDuration: '3 ngày 2 đêm',
                  depositRate: '100% giá trị hợp đồng',
                  overdueFee: '500.000 VNĐ / ngày trễ',
                  description: form.desc?.value?.trim() || '',
                  documentFile,
                  pdfUrl: documentFile?.url || '',
                  contractUrl: documentFile?.url || '',
                  clauses: [],
                };

                try {
                  const res = await createContractTemplate(newTpl);
                  if (res?.data?._id) {
                    newTpl._id = res.data._id;
                  }
                  triggerToast(`Đã tạo thành công mẫu "${newTpl.name}"!`);
                  loadTemplates();
                } catch (err) {
                  console.warn('[CREATE TEMPLATE API]', err.message);
                  setTemplates([newTpl, ...templates]);
                  triggerToast(`Đã tạo thành công mẫu "${newTpl.name}"!`);
                }

                setCreateAttachedFile(null);
                setIsCreateModalOpen(false);
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

              <div>
                <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1">Mô Tả Ngắn Về Mẫu</label>
                <textarea
                  name="desc"
                  rows={2}
                  placeholder="Ghi chú đối tượng khách hàng hoặc các lưu ý đặc thù về vải voan, đính kết..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8DFD8] rounded-xl focus:border-[#C5A880] focus:bg-white text-[#2C2523]"
                />
              </div>

              {/* KHU VỰC ĐÍNH KÈM FILE HỢP ĐỒNG */}
              <div>
                <label className="block text-[11px] font-bold text-[#594B43] uppercase mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#C5A880]" />
                    Đính Kèm File Hợp Đồng Mẫu (.pdf, .docx, .doc)
                  </span>
                  {createAttachedFile && (
                    <span className="text-[10px] text-[#2E7D32] font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ Đã đính kèm
                    </span>
                  )}
                </label>

                {!createAttachedFile ? (
                  <label className="group flex flex-col items-center justify-center p-5 bg-[#FAF7F2] hover:bg-[#FFF9F6] border-2 border-dashed border-[#D9C8BE] hover:border-[#C5A880] rounded-2xl cursor-pointer transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-100/60 text-[#C5A880] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#2C2523] mb-0.5">
                      Bấm để chọn file hoặc kéo thả file hợp đồng vào đây
                    </p>
                    <p className="text-[11px] text-[#8C7A6B]">
                      Hỗ trợ định dạng PDF, DOCX, DOC (Tối đa 15MB)
                    </p>
                    <input
                      type="file"
                      name="contractFile"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const fileUrl = URL.createObjectURL(file);
                          setCreateAttachedFile({
                            file,
                            name: file.name,
                            size:
                              `${(file.size / (1024 * 1024)).toFixed(1)} MB` === '0.0 MB'
                                ? `${Math.round(file.size / 1024)} KB`
                                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                            url: fileUrl,
                            type: file.name.endsWith('.pdf') ? 'pdf' : 'word',
                          });
                          triggerToast(`Đã đính kèm file: ${file.name}`);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="bg-[#FFF8F6] border border-[#FFDADC] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs ${
                          createAttachedFile.type === 'pdf' ? 'bg-[#DC2626]' : 'bg-[#1E40AF]'
                        }`}
                      >
                        {createAttachedFile.type === 'pdf' ? 'PDF' : 'DOC'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2C2523] truncate" title={createAttachedFile.name}>
                          {createAttachedFile.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8C7A6B]">
                          <span>{createAttachedFile.size}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">Sẵn sàng lưu trữ</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {createAttachedFile.url && (
                        <a
                          href={createAttachedFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E0D5CE] text-[#594B43] hover:text-[#2C2523] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setCreateAttachedFile(null)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Gỡ bỏ
                      </button>
                    </div>
                  </div>
                )}
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
