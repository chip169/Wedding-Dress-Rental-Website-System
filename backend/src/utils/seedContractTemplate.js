import ContractTemplate from '../models/ContractTemplate.model.js';

// Danh sách các điều khoản pháp lý chuẩn mực của mẫu Hợp đồng Thuê Lễ Phục Cưới Cao Cấp (8 Điều)
const HAUTE_COUTURE_CLAUSES = [
  {
    id: 1,
    title: 'ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & TIÊU CHUẨN LỄ PHỤC CƯỚI',
    content:
      '1.1. Bên A đồng ý cho Bên B thuê tác phẩm váy cưới độc bản thiết kế mang tên theo thông tin đơn thuê chi tiết, kích cỡ may đo chuẩn mực theo yêu cầu của Bên B.\n' +
      '1.2. Tiêu chuẩn bàn giao: Tác phẩm đạt chuẩn Haute Couture, khung xương nẹp corset siết eo công nghệ Pháp, được giặt sấy tiệt trùng ozone sinh học, ủi phẳng phiu và đặt trong Vali VIP Courier bảo quản chống bụi nhiệt trước giờ trao nhận 02 giờ.\n' +
      '1.3. Tinh chỉnh may đo: Bên A cung cấp dịch vụ tinh chỉnh nới/siết phom theo đúng thông số số đo chuẩn (Chiều cao, Cân nặng, Vòng eo) đã được ghi nhận của Bên B.',
  },
  {
    id: 2,
    title: 'ĐIỀU 2: THỜI HẠN THUÊ & PHƯƠNG THỨC GIAO NHẬN',
    content:
      '2.1. Tổng thời gian thuê: Được xác định theo gói ngày Bên B lựa chọn (từ 2 đến 30 ngày liên tục).\n' +
      '2.2. Thời điểm nhận váy: Từ 09:00 ngày bắt đầu thuê ghi nhận trên phiếu đặt tại Showroom UniBridal hoặc bàn giao tận nơi.\n' +
      '2.3. Ngày tổ chức hôn lễ chính thức: Được ghi rõ để Atelier hoàn tất ủi sấy và kiểm định phụ kiện trước hôn lễ 24 giờ.\n' +
      '2.4. Thời điểm hoàn trả váy: Trước 20:00 ngày kết thúc thuê tại Showroom hoặc bàn giao cho chuyên viên thu hồi tận nơi.\n' +
      '2.5. Hai bên thực hiện ký Biên bản kiểm định bàn giao để ghi nhận hiện trạng đính kết ren, hạt cườm và kết cấu váy tại thời điểm giao và nhận lại.',
  },
  {
    id: 3,
    title: 'ĐIỀU 3: GIÁ THUÊ & PHƯƠNG THỨC THANH TOÁN',
    content:
      '3.1. Tổng giá trị hợp đồng thuê trọn gói đã bao gồm VAT, dịch vụ giặt hấp khử khuẩn và phí tinh chỉnh phom váy.\n' +
      '3.2. Tiền đặt cọc giữ lịch độc quyền (50% giá trị hợp đồng): Bên B thanh toán ngay khi ký hợp đồng thông qua cổng chuyển khoản VietQR hoặc thẻ ngân hàng.\n' +
      '3.3. Số tiền thuê còn lại (50%) sẽ được Bên B thanh toán dứt điểm tại thời điểm nhận bàn giao lễ phục.',
  },
  {
    id: 4,
    title: 'ĐIỀU 4: TIỀN ĐẶT CỌC BẢO LÃNH HOÀN TRẢ & CAM KẾT HOÀN TIỀN 100%',
    content:
      '4.1. Tiền cọc bảo lãnh trách nhiệm bảo quản (Hình thức: Tiền mặt, chuyển khoản hoặc ủy quyền khóa hạn mức thẻ tín dụng).\n' +
      '4.2. Cam kết hoàn cọc 100%: Bên A cam kết hoàn trả đầy đủ 100% số tiền cọc bảo lãnh vào số tài khoản ngân hàng của Bên B trong vòng tối đa 24 giờ làm việc sau khi hai bên nghiệm thu lễ phục hoàn trả nguyên vẹn.',
  },
  {
    id: 5,
    title: 'ĐIỀU 5: QUY CHUẨN BẢO QUẢN & CHÍNH SÁCH BẢO HIỂM VẢI REN',
    content:
      '5.1. Bảo hiểm vết bẩn sự kiện cưới: Bên A áp dụng chính sách bảo hiểm miễn phí xử lý đối với các vết bẩn thông thường như bụi sân khấu, vết bùn đất gấu váy hoặc vết rượu vang rơi vãi nhẹ. Bên A chịu 100% chi phí xử lý bằng dung môi sinh học chuyên dụng.\n' +
      '5.2. Trách nhiệm của Bên B: Giữ gìn lễ phục ở nơi khô ráo, thoáng mát, treo cao bằng móc chống biến dạng; tuyệt đối không để tàn thuốc lá, pháo sáng hoặc vật sắc nhọn tiếp xúc gần với bề mặt ren.\n' +
      '5.3. Nghiêm cấm: Bên B tuyệt đối không tự ý cắt may, thay đổi kết cấu, dán keo vải hoặc đem váy đến các tiệm giặt ủi thông thường bên ngoài.',
  },
  {
    id: 6,
    title: 'ĐIỀU 6: QUY ĐỊNH BỒI HOÀN KHI HƯ HỎNG, TRỄ HẠN HOẶC MẤT MÁT',
    content:
      '6.1. Bàn giao hoàn trả trễ hạn: Nếu Bên B hoàn trả sau 20:00 ngày kết thúc thuê mà không có thỏa thuận gia hạn trước bằng văn bản, Bên B chịu phí lưu dụng là 800.000 VNĐ/ngày để bù đắp chi phí gián đoạn lịch của cô dâu tiếp theo.\n' +
      '6.2. Hư hỏng có thể khắc phục (rách ren nhỏ, đứt chỉ đính hạt): Bên B bồi hoàn chi phí công phục dựng thủ công của nghệ nhân theo hóa đơn thực tế, tối đa không vượt quá 15% tiền cọc bảo lãnh.\n' +
      '6.3. Hư hỏng nặng không thể phục hồi (cháy rách mảng lớn, loang màu hóa chất không tẩy được, hoặc mất mát): Bên B chịu trách nhiệm bồi thường theo giá trị niêm yết xuất kho của tác phẩm sau khi khấu trừ 20% hao mòn tự nhiên.',
  },
  {
    id: 7,
    title: 'ĐIỀU 7: QUYỀN THAY ĐỔI LỊCH CƯỚI, HỦY HỢP ĐỒNG & BẤT KHẢ KHÁNG',
    content:
      '7.1. Đổi ngày cưới miễn phí: Bên B được quyền chuyển đổi ngày thuê sang bất kỳ ngày nào còn trống trong vòng 12 tháng hoàn toàn miễn phí khi gửi thông báo trước tối thiểu 15 ngày so với ngày nhận váy ban đầu.\n' +
      '7.2. Trường hợp bất khả kháng: Trong trường hợp xảy ra thiên tai, dịch bệnh hoặc các quyết định cấm tập trung của Cơ quan Nhà nước có thẩm quyền, hai bên thống nhất bảo lưu 100% giá trị hợp đồng và tiền đặt cọc trong thời hạn 18 tháng mà không phải chịu bất kỳ khoản phạt nào.',
  },
  {
    id: 8,
    title: 'ĐIỀU 8: GIẢI QUYẾT TRANH CHẤP & HIỆU LỰC PHÁP LÝ HỢP ĐỒNG ĐIỆN TỬ',
    content:
      '8.1. Căn cứ theo Điều 12 và Điều 13 Luật Giao dịch điện tử số 20/2023/QH15, Hợp đồng này được xác lập bằng phương tiện điện tử, chữ ký tay số và chữ ký điện tử của hai bên có giá trị pháp lý ràng buộc đầy đủ tương đương với văn bản giấy có chữ ký trực tiếp và con dấu mộc đỏ.\n' +
      '8.2. Mọi tranh chấp phát sinh từ hợp đồng này sẽ được ưu tiên giải quyết thông qua thương lượng hòa giải thiện chí. Nếu không hòa giải được, vụ việc sẽ được đưa ra Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh để giải quyết theo quy định pháp luật Việt Nam.\n' +
      '8.3. Hợp đồng có hiệu lực kể từ thời điểm Bên B hoàn tất ký điện tử và thanh toán khoản đặt cọc giữ lịch. Bản điện tử được lưu trữ tại hệ thống cơ sở dữ liệu UniBridal và được tự động gửi vào địa chỉ Email của Bên B để làm bằng chứng pháp lý.',
  },
];

const DEFAULT_TEMPLATES = [
  {
    code: 'TPL-HC-01',
    name: 'Hợp Đồng Thuê Lễ Phục Cưới Cao Cấp (Haute Couture)',
    category: 'Haute Couture',
    badge: 'Mặc định hệ thống',
    status: 'active',
    version: 'v2026.1',
    updatedBy: 'Ông Kim Xuân Hiếu (Tổng Giám Đốc)',
    appliedCount: 142,
    defaultDuration: '4 ngày 3 đêm (Tùy chỉnh 2-30 ngày)',
    depositRate: '50% giá trị hợp đồng giữ lịch & 15.000.000₫ bảo lãnh hoàn trả 100%',
    overdueFee: '800.000 VNĐ / ngày trễ',
    description: 'Mẫu hợp đồng thuê lễ phục cưới cao cấp tiêu chuẩn pháp lý Việt Nam, tích hợp bảo hiểm vải ren sinh học, cam kết hoàn cọc 100% trong 24h và chữ ký điện tử.',
    pdfUrl: 'http://localhost:5000/api/contract-templates/TPL-HC-01/pdf',
    contractUrl: 'http://localhost:5000/api/contract-templates/TPL-HC-01/pdf',
    documentFile: {
      url: 'http://localhost:5000/api/contract-templates/TPL-HC-01/pdf',
      name: 'Hop_Dong_Thue_Le_Phuc_Cuoi_Haute_Couture.pdf',
      size: '286 KB',
      uploadedAt: new Date('2026-10-29'),
    },
    clauses: HAUTE_COUTURE_CLAUSES,
    isDefault: true,
  },
  {
    code: 'TPL-BP-02',
    name: 'Mẫu Hợp Đồng May Đo Thiết Kế Mới & Thuê Nước Đầu (Bespoke First-Wear)',
    category: 'Bespoke First-Wear',
    badge: 'May đo độc bản',
    status: 'active',
    version: 'v2026.1',
    updatedBy: 'Ông Kim Xuân Hiếu (Tổng Giám Đốc)',
    appliedCount: 56,
    defaultDuration: '5 ngày 4 đêm',
    depositRate: '50% giá trị may đo & 20.000.000₫ cọc bảo lãnh',
    overdueFee: '1.000.000 VNĐ / ngày trễ',
    description: 'Áp dụng cho dòng váy cưới may đo độc quyền nước đầu tiên theo số đo của cô dâu.',
    pdfUrl: 'http://localhost:5000/api/contract-templates/TPL-BP-02/pdf',
    contractUrl: 'http://localhost:5000/api/contract-templates/TPL-BP-02/pdf',
    documentFile: {
      url: 'http://localhost:5000/api/contract-templates/TPL-BP-02/pdf',
      name: 'Hop_Dong_May_Do_Bespoke_First_Wear.pdf',
      size: '312 KB',
      uploadedAt: new Date('2026-10-29'),
    },
    clauses: HAUTE_COUTURE_CLAUSES,
    isDefault: false,
  },
];

/**
 * Hàm tự động khởi tạo / đồng bộ Mẫu Hợp đồng chuẩn vào MongoDB
 */
export const seedContractTemplates = async () => {
  try {
    for (const tpl of DEFAULT_TEMPLATES) {
      await ContractTemplate.findOneAndUpdate(
        { code: tpl.code },
        { $set: tpl },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log('Contract Templates (8 Điều khoản pháp lý) synchronized successfully.');
  } catch (error) {
    console.error('Error seeding contract templates:', error.message);
  }
};

export default seedContractTemplates;

