import * as templateService from '../services/contractTemplate.service.js';

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await templateService.getAllTemplates(req.query);
    res.status(200).json({
      success: true,
      message: 'Lấy danh sách mẫu hợp đồng thành công',
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (req, res, next) => {
  try {
    const template = await templateService.getTemplateByIdOrCode(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết mẫu hợp đồng thành công',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const getDefaultTemplate = async (req, res, next) => {
  try {
    const template = await templateService.getDefaultTemplate();
    res.status(200).json({
      success: true,
      message: 'Lấy mẫu hợp đồng mặc định thành công',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (req, res, next) => {
  try {
    const newTemplate = await templateService.createTemplate(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo mới mẫu hợp đồng thành công',
      data: newTemplate,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (req, res, next) => {
  try {
    const updated = await templateService.updateTemplate(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Cập nhật mẫu hợp đồng thành công',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Hiển thị trực tiếp bản PDF / Văn bản Hợp đồng A4 chuẩn in ấn
 */
export const renderTemplatePdf = async (req, res, next) => {
  try {
    const template = await templateService.getTemplateByIdOrCode(req.params.id);
    const todayStr = new Date().toLocaleDateString('vi-VN');

    const clausesHtml = (template.clauses || [])
      .map(
        (c) => `
        <div class="clause-heading">${c.title}</div>
        <p>${(c.content || '').replace(/\n/g, '<br />')}</p>
      `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Hop_Dong_Mau_${template.code || 'UB'}.pdf</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background: #525659;
            font-family: 'Times New Roman', Times, serif;
            color: #111;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .pdf-toolbar {
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            height: 52px;
            background: #323639;
            color: #f1f1f1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.35);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .pdf-toolbar-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .pdf-badge {
            background: #c62828;
            color: #fff;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
          }
          .pdf-filename {
            font-size: 13.5px;
            font-weight: 500;
            color: #f5f5f5;
          }
          .pdf-toolbar-right {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .btn-action {
            background: #733F49;
            color: #fff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: background 0.2s;
            text-decoration: none;
          }
          .btn-action:hover {
            background: #5a2e37;
          }
          .pdf-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px 16px 50px;
          }
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            padding: 22mm 20mm;
            box-shadow: 0 4px 25px rgba(0,0,0,0.35);
            position: relative;
            margin-bottom: 24px;
            font-size: 12.5pt;
            line-height: 1.5;
          }
          .header-box { text-align: center; margin-bottom: 20px; }
          .header-box h3 { margin: 0; font-size: 12pt; text-transform: uppercase; font-weight: bold; }
          .header-box h4 { margin: 2px 0 6px; font-size: 11.5pt; font-weight: normal; font-style: italic; }
          .header-box .divider { width: 150px; height: 1.5px; background: #222; margin: 4px auto 14px; }
          .header-box h1 { margin: 10px 0 4px; font-size: 16pt; color: #733F49; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; }
          .header-box .doc-code { font-style: italic; font-size: 11pt; color: #555; }
          .law-intro { font-style: italic; font-size: 11pt; text-align: justify; margin: 12px 0 10px; line-height: 1.45; }
          .parties-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 16px; }
          .parties-table td { width: 50%; vertical-align: top; padding: 10px 12px; border: 1px solid #aaa; font-size: 11pt; line-height: 1.45; }
          .parties-table .col-title { font-weight: bold; color: #733F49; text-transform: uppercase; margin-bottom: 5px; font-size: 11.5pt; }
          .clause-heading { font-weight: bold; font-size: 12pt; color: #733F49; margin-top: 14px; margin-bottom: 5px; text-transform: uppercase; }
          p { margin: 4px 0; text-align: justify; }
          .signatures-table { width: 100%; border-collapse: collapse; margin-top: 25px; page-break-inside: avoid; }
          .signatures-table td { width: 50%; text-align: center; vertical-align: top; padding: 10px; border: none; }
          .sig-title { font-weight: bold; font-size: 11.5pt; text-transform: uppercase; margin-bottom: 3px; }
          .sig-sub { font-style: italic; font-size: 10pt; color: #555; margin-bottom: 10px; }
          .sign-name { font-weight: bold; font-size: 12pt; margin-top: 6px; }
          .page-footer {
            border-top: 1px solid #ddd;
            margin-top: 25px;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 9.5pt;
            color: #888;
            font-style: italic;
          }
          @media print {
            .no-print { display: none !important; }
            .pdf-container { padding: 0 !important; }
            body { background: #fff !important; }
            .a4-page { box-shadow: none !important; margin: 0 !important; width: 100% !important; padding: 15mm 15mm !important; }
          }
        </style>
      </head>
      <body>
        <div class="pdf-toolbar no-print">
          <div class="pdf-toolbar-left">
            <span class="pdf-badge">PDF CHUẨN</span>
            <span class="pdf-filename">${template.name} (${template.code})</span>
          </div>
          <div class="pdf-toolbar-right">
            <button class="btn-action" onclick="window.print()">
              🖨️ In / Lưu PDF
            </button>
          </div>
        </div>

        <div class="pdf-container">
          <div class="a4-page">
            <div class="header-box">
              <h3>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
              <h4>Độc lập — Tự do — Hạnh phúc</h4>
              <div class="divider"></div>
              <h1>${template.name}</h1>
              <div class="doc-code">Mã Mẫu: ${template.code} • Phiên bản: ${template.version || 'v2026.1'} • Ngày áp dụng: ${todayStr}</div>
            </div>

            <div class="law-intro">
              - Căn cứ Bộ luật Dân sự số 91/2015/QH13 đã được Quốc hội Nước CHXHCN Việt Nam thông qua ngày 24/11/2015;<br />
              - Căn cứ Luật Thương mại số 36/2005/QH11 của Quốc hội ban hành ngày 14/06/2005;<br />
              - Căn cứ Luật Giao dịch điện tử số 20/2023/QH15 của Quốc hội ban hành ngày 22/06/2023;<br />
              - Xét theo nhu cầu sử dụng trang phục cưới và cam kết dịch vụ giữa hai bên.
            </div>

            <p>Hôm nay, ngày ${todayStr}, chúng tôi gồm có các bên ký kết:</p>

            <table class="parties-table">
              <tr>
                <td>
                  <div class="col-title">BÊN CHO THUÊ (BÊN A):</div>
                  <strong>CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE</strong><br />
                  Mã số thuế: <strong>0316889988</strong><br />
                  Địa chỉ: 88 Nam Kỳ Khởi Nghĩa, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh<br />
                  Hotline: <strong>1800 8998</strong> • Email: contact@unibridal.vn<br />
                  Người đại diện: <strong>Ông Kim Xuân Hiếu</strong><br />
                  Chức vụ: <strong>Tổng Giám Đốc</strong>
                </td>
                <td>
                  <div class="col-title">BÊN THUÊ LỄ PHỤC (BÊN B):</div>
                  Họ và tên: <strong>[Họ và tên Cô dâu / Khách hàng]</strong><br />
                  Số CCCD/CMND: <strong>[Số CCCD gắn chip]</strong><br />
                  Số điện thoại: <strong>[Số điện thoại liên hệ]</strong><br />
                  Email: <strong>[Địa chỉ Email nhận hợp đồng]</strong><br />
                  Địa chỉ: <strong>[Địa chỉ nhận bàn giao lễ phục]</strong><br />
                  Thông số may đo: Chiều cao • Cân nặng • Vòng eo
                </td>
              </tr>
            </table>

            <p>Hai bên thống nhất ký kết hợp đồng thuê lễ phục cưới với các điều khoản pháp lý cụ thể như sau:</p>

            ${clausesHtml}

            <table class="signatures-table">
              <tr>
                <td>
                  <div class="sig-title">ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</div>
                  <div class="sig-sub">CÔNG TY TNHH UNIBRIDAL HAUTE COUTURE</div>
                  <div style="font-family: 'Playfair Display', cursive, serif; font-style: italic; font-size: 32px; color: #111; font-weight: 700; transform: rotate(-5deg); margin: 12px 0;">
                    Hieu
                  </div>
                  <div class="sign-name">Ông Kim Xuân Hiếu</div>
                  <div style="font-size: 10.5pt; color: #555;">Tổng Giám Đốc</div>
                </td>
                <td>
                  <div class="sig-title">BÊN THUÊ LỄ PHỤC (BÊN B)</div>
                  <div class="sig-sub">XÁC NHẬN BẰNG CHỮ KÝ ĐIỆN TỬ</div>
                  <div style="font-family: serif; font-size: 18pt; font-style: italic; color: #1D2A44; margin: 18px 0;">
                    [Chữ ký điện tử / SmartOTP]
                  </div>
                  <div class="sign-name">[Tên Khách Hàng]</div>
                  <div style="font-size: 10.5pt; color: #555;">Bên Thuê Lễ Phục</div>
                </td>
              </tr>
            </table>

            <div class="page-footer">
              <span>Văn bản hợp đồng mẫu điện tử được lưu trữ tại UniBridal Atelier Việt Nam</span>
              <span>Mã mẫu: ${template.code} • ${template.badge || 'Tiêu chuẩn'}</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

