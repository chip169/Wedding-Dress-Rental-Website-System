import nodemailer from 'nodemailer';

/**
 * Khởi tạo Transporter gửi email
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    if (!process.env.EMAIL_HOST || process.env.EMAIL_HOST.includes('gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: { user, pass },
    });
  }

  return null;
};

/**
 * Gửi email xác thực tài khoản với mã OTP 6 số
 */
export async function sendVerificationEmail(to, otp, fullName = 'Quý khách') {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E6DAC8; border-radius: 12px; overflow: hidden; color: #2C2523;">
      <div style="background: linear-gradient(135deg, #2C2523 0%, #453735 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;">
        <h1 style="font-family: 'Times New Roman', Times, serif; font-size: 26px; margin: 0; letter-spacing: 2px; color: #FDFBF7;">UNIBRIDAL</h1>
        <p style="font-size: 11px; letter-spacing: 3px; color: #B8737D; margin-top: 6px; text-transform: uppercase;">Haute Couture Bridal Atelier</p>
      </div>

      <div style="padding: 36px 32px;">
        <h2 style="font-family: 'Times New Roman', Times, serif; font-size: 20px; color: #2C2523; margin-top: 0;">Xác Thực Tài Khoản Đăng Ký</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #514344;">
          Xin chào <strong>${fullName}</strong>,<br>
          Cảm ơn bạn đã lựa chọn UniBridal. Để kích hoạt tài khoản thành viên và bắt đầu trải nghiệm dịch vụ thuê váy cưới cao cấp, vui lòng sử dụng mã xác thực OTP dưới đây:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: #FFF0ED; border: 2px dashed #B8737D; border-radius: 10px; padding: 14px 36px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #854F55;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #847374; margin-top: 8px;">Mã OTP có hiệu lực trong vòng <strong>3 phút</strong>.</p>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #847374;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ hotline UniBridal <strong>0908 123 888</strong> để được hỗ trợ.
        </p>
      </div>

      <div style="background: #FAF6F0; padding: 18px 24px; text-align: center; font-size: 11px; color: #847374; border-top: 1px solid #E6DAC8;">
        © 2026 UniBridal Atelier. Bảo lưu mọi quyền. • 128 Đồng Khởi, Bến Nghé, Quận 1, TP. HCM
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const senderName = process.env.EMAIL_FROM_NAME || 'UniBridal Haute Couture';
      const info = await transporter.sendMail({
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `[UniBridal] Mã xác thực đăng ký tài khoản: ${otp}`,
        html,
      });
      console.log(`[EMAIL SENT SUCCESS] Gửi OTP đăng ký tới ${to} thành công! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL SEND FAILED] Lỗi gửi email tới ${to}:`, err.message);
      return { simulated: true, otp, error: err.message };
    }
  } else {
    console.log(`[EMAIL VERIFY SIMULATION] To: ${to} | OTP: ${otp}`);
    return { simulated: true, otp };
  }
}

/**
 * Gửi email đặt lại mật khẩu với mã OTP 6 số
 */
export async function sendResetPasswordEmail(to, otp, fullName = 'Quý khách') {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E6DAC8; border-radius: 12px; overflow: hidden; color: #2C2523;">
      <div style="background: linear-gradient(135deg, #2C2523 0%, #453735 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;">
        <h1 style="font-family: 'Times New Roman', Times, serif; font-size: 26px; margin: 0; letter-spacing: 2px; color: #FDFBF7;">UNIBRIDAL</h1>
        <p style="font-size: 11px; letter-spacing: 3px; color: #B8737D; margin-top: 6px; text-transform: uppercase;">Haute Couture Bridal Atelier</p>
      </div>

      <div style="padding: 36px 32px;">
        <h2 style="font-family: 'Times New Roman', Times, serif; font-size: 20px; color: #2C2523; margin-top: 0;">Yêu Cầu Đặt Lại Mật Khẩu</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #514344;">
          Xin chào <strong>${fullName}</strong>,<br>
          Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản UniBridal của bạn. Vui lòng nhập mã OTP sau để tiến hành thiết lập mật khẩu mới:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: #FFF0ED; border: 2px dashed #B8737D; border-radius: 10px; padding: 14px 36px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #854F55;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #847374; margin-top: 8px;">Mã có hiệu lực trong vòng <strong>3 phút</strong>.</p>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #847374;">
          Vì lý do bảo mật, tuyệt đối không chia sẻ mã này cho bất kỳ ai.
        </p>
      </div>

      <div style="background: #FAF6F0; padding: 18px 24px; text-align: center; font-size: 11px; color: #847374; border-top: 1px solid #E6DAC8;">
        © 2026 UniBridal Atelier. Bảo lưu mọi quyền. • 128 Đồng Khởi, Bến Nghé, Quận 1, TP. HCM
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const senderName = process.env.EMAIL_FROM_NAME || 'UniBridal Haute Couture';
      const info = await transporter.sendMail({
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `[UniBridal] Mã xác thực đặt lại mật khẩu: ${otp}`,
        html,
      });
      console.log(`[EMAIL SENT SUCCESS] Gửi OTP đặt lại mật khẩu tới ${to} thành công! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL SEND FAILED] Lỗi gửi email tới ${to}:`, err.message);
      return { simulated: true, otp, error: err.message };
    }
  } else {
    console.log(`[FORGOT PASSWORD OTP SIMULATION] To: ${to} | OTP: ${otp}`);
    return { simulated: true, otp };
  }
}

/**
 * Gửi email thông báo Showroom đã lập biên bản kiểm định trả váy
 */
export async function sendInspectionNotificationEmail({
  to,
  fullName = 'Quý khách',
  orderCode,
  inspectionCode,
  inspectorName = 'Chuyên Viên Atelier UniBridal',
  totalDeposit = 0,
  totalDeduction = 0,
  finalRefundAmount = 0,
  inspectionItems = [],
  inspectionDate,
  bankDetails = null,
  returnUrl = 'http://localhost:3000/profile/orders',
}) {
  const transporter = createTransporter();
  const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN') + ' đ';
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Hôm nay';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const bankHtml = bankDetails?.accountNumber
    ? `
      <div style="background: #F8F5F2; border: 1px dashed #D5C2B9; border-radius: 10px; padding: 12px 16px; margin: 18px 0; font-size: 13px; line-height: 1.6;">
        <strong style="color: #733F49; display: block; margin-bottom: 4px;">✦ Thông tin tài khoản nhận tiền hoàn cọc của nàng:</strong>
        <div>• Ngân hàng: <strong>${bankDetails.bankName || 'Ngân hàng nội địa'}</strong></div>
        <div>• Số tài khoản (STK): <strong style="color: #1E8347; font-size: 14px; letter-spacing: 1px;">${bankDetails.accountNumber}</strong></div>
        <div>• Chủ tài khoản: <strong style="text-transform: uppercase;">${bankDetails.accountHolder || fullName}</strong></div>
      </div>
    `
    : '';

  const checklistHtml = (inspectionItems && inspectionItems.length > 0)
    ? `
      <div style="margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 700; color: #733F49; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          ✦ KẾT QUẢ KIỂM ĐỊNH HIỆN TRẠNG CHI TIẾT
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          ${inspectionItems.map(item => `
            <tr style="border-bottom: 1px solid #F5EBE8;">
              <td style="padding: 8px 0; color: #2C2523;">• ${item.name || 'Hạng mục kiểm tra'}</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${item.passed ? '#1E8347' : '#C53030'};">
                ${item.status || (item.passed ? '✓ Nguyên vẹn' : 'Có phát sinh khấu trừ')}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `
    : `
      <div style="background: #FCF9F6; border: 1px dashed #EEDECF; border-radius: 10px; padding: 12px 16px; margin: 18px 0; font-size: 12.5px; line-height: 1.6; color: #514344;">
        • <strong>Hiện trạng trang phục:</strong> Đã kiểm tra phom dáng, chất liệu vải, độ nguyên vẹn của ren và hạt cườm Swarovski.<br>
        • <strong>Phụ kiện bàn giao:</strong> Đầy đủ vali chống sốc, túi chống bụi và móc treo lễ phục chuyên dụng.
      </div>
    `;

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #FAF5F3; border: 1px solid #EEDECF; border-radius: 16px; overflow: hidden; color: #2C2523;">
      <div style="background: linear-gradient(135deg, #733F49 0%, #4D262F 100%); padding: 34px 24px; text-align: center; color: #FFFFFF;">
        <div style="display: inline-block; padding: 4px 14px; border-radius: 20px; background: rgba(212, 175, 55, 0.2); border: 1px solid #D4AF37; color: #D4AF37; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 8px;">
          ✦ HAUTE COUTURE INSPECTION REPORT ✦
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif; font-size: 26px; margin: 0; color: #FFFFFF; letter-spacing: 0.5px;">BIÊN BẢN KIỂM ĐỊNH LỄ PHỤC</h1>
        <p style="font-size: 12px; letter-spacing: 2px; color: #F0D5CD; margin-top: 6px; text-transform: uppercase;">Quyết Toán và Hoàn Trả Quỹ Cọc Bảo Lãnh</p>
      </div>

      <div style="padding: 30px 28px; background: #FFFFFF;">
        <div style="background: #FFF5F2; border: 1px solid #F5DED7; border-radius: 12px; padding: 16px 20px; margin-bottom: 22px; text-align: center;">
          <h2 style="font-family: 'Times New Roman', Times, serif; font-size: 19px; color: #733F49; margin: 0 0 6px 0;">
            ✦ Showroom Đã Lập Biên Bản Kiểm Định Trả Váy
          </h2>
          <p style="font-size: 13.5px; color: #514344; margin: 0; line-height: 1.6;">
            Đơn thuê mã: <strong style="color: #733F49;">#${orderCode}</strong> • Chuyên viên kiểm định: <strong>${inspectorName}</strong>
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #514344;">
          Kính chào <strong>${fullName}</strong>,<br>
          Chuyên viên Atelier của UniBridal đã tiến hành kiểm định hiện trạng trang phục cưới sau khi tiếp nhận hoàn trả từ nàng vào ngày <strong>${formatDate(inspectionDate)}</strong>. Dưới đây là kết quả kiểm định và chi tiết quyết toán tiền cọc bảo lãnh:
        </p>

        ${checklistHtml}

        <div style="background: #FFF8F6; border-left: 4px solid #B8737D; padding: 12px 16px; margin: 20px 0; border-radius: 0 10px 10px 0;">
          <p style="font-size: 13px; line-height: 1.6; color: #733F49; margin: 0 0 6px 0; font-weight: 600;">
            ✦ Đối chiếu Hợp đồng: Toàn bộ chi phí phục chế được áp dụng theo mức cố định niêm yết tại <strong>Điều 5 & Phụ lục Hợp đồng thuê váy</strong> đã ký kết, đảm bảo tính minh bạch tuyệt đối.
          </p>
          <p style="font-size: 13px; line-height: 1.6; color: #514344; margin: 0;">
            Nàng vui lòng xem bảng quyết toán dưới đây. Khi nàng xác nhận đồng ý, hệ thống sẽ tiến hành giải ngân hoàn cọc về tài khoản ngân hàng của nàng.
          </p>
        </div>

        <!-- Bảng tóm tắt số tiền -->
        <div style="background: #FAF5F3; border: 1.5px solid #EEDECF; border-radius: 12px; padding: 20px; margin: 22px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr>
              <td style="padding: 7px 0; color: #7A6B6C;">Tiền đặt cọc ban đầu:</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 600; color: #2C2523;">${formatMoney(totalDeposit)}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #7A6B6C;">Khấu trừ (hư tổn / phụ phí phát sinh nếu có):</td>
              <td style="padding: 7px 0; text-align: right; font-weight: 600; color: ${totalDeduction > 0 ? '#C53030' : '#1E8347'};">
                ${totalDeduction > 0 ? `-${formatMoney(totalDeduction)}` : '0 đ (Nguyên vẹn 100%)'}
              </td>
            </tr>
            <tr style="border-top: 1px dashed #D8C3BE;">
              <td style="padding: 12px 0 4px 0; font-weight: bold; color: #5F2B36; font-size: 15px;">Số tiền cọc thực nhận hoàn lại:</td>
              <td style="padding: 12px 0 4px 0; text-align: right; font-weight: 800; color: #1E8347; font-size: 18px;">${formatMoney(finalRefundAmount)}</td>
            </tr>
          </table>
        </div>

        ${bankHtml}

        <!-- Nút hành động nổi bật -->
        <div style="text-align: center; margin: 32px 0 16px 0;">
          <a href="${returnUrl}" style="display: inline-block; background: linear-gradient(135deg, #733F49 0%, #54222B 100%); color: #FFFFFF; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 14px rgba(115, 63, 73, 0.28); letter-spacing: 0.5px;">
            ✦ Xem Chi Tiết Biên Bản và Xác Nhận Nhận Cọc
          </a>
        </div>

        <p style="font-size: 12px; color: #847374; text-align: center; margin-top: 14px;">
          Nếu chưa hài lòng với kết quả kiểm định, nàng có quyền gửi đơn khiếu nại trong vòng 24 giờ trực tiếp trên hệ thống hoặc qua hotline hỗ trợ.
        </p>
      </div>

      <div style="background: #FAF0EC; padding: 18px 24px; text-align: center; font-size: 11.5px; color: #847374; border-top: 1px solid #EEDECF;">
        © 2026 UniBridal Atelier. Hotline hỗ trợ hoàn cọc: 1800 8998 • 128 Đồng Khởi, Bến Nghé, Quận 1, TP. HCM
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const senderName = process.env.EMAIL_FROM_NAME || 'UniBridal Haute Couture';
      const info = await transporter.sendMail({
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `[UniBridal] ✦ Showroom đã lập Biên Bản Kiểm Định Trả Váy #${orderCode}`,
        html,
      });
      console.log(`[EMAIL INSPECTION SUCCESS] Đã gửi biên bản kiểm định đơn #${orderCode} tới ${to}! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL INSPECTION FAILED] Lỗi gửi email tới ${to}:`, err.message);
      return { simulated: true, error: err.message };
    }
  } else {
    console.log(`[EMAIL INSPECTION SIMULATION] To: ${to} | Order: #${orderCode}`);
    return { simulated: true };
  }
}

/**
 * Gửi email thông báo hoàn cọc thành công sau khi khách duyệt biên bản
 */
export async function sendRefundConfirmationEmail({
  to,
  fullName = 'Quý khách',
  orderCode,
  finalRefundAmount = 0,
  bankDetails = null,
  negotiationNote = '',
}) {
  const transporter = createTransporter();
  const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN') + ' đ';

  const bankHtml = bankDetails?.accountNumber
    ? `
      <div style="background: #F8F5F2; border: 1px dashed #D5C2B9; border-radius: 10px; padding: 14px 18px; margin: 18px 0; font-size: 13px; line-height: 1.6;">
        <strong style="color: #5F2B36; display: block; margin-bottom: 6px; font-size: 13.5px;">Thông tin hoàn trả tiền cọc:</strong>
        <div>• Phương thức: <strong>${bankDetails.bankName === 'Tiền mặt tại quầy' ? 'Tiền mặt trực tiếp tại quầy Showroom' : 'Chuyển khoản qua tài khoản ngân hàng'}</strong></div>
        ${bankDetails.accountNumber && bankDetails.accountNumber !== 'TIỀN MẶT' ? `<div>• Ngân hàng thụ hưởng: <strong>${bankDetails.bankName || 'Ngân hàng nội địa'}</strong></div><div>• Số tài khoản (STK): <strong style="letter-spacing: 1px;">${bankDetails.accountNumber}</strong></div><div>• Chủ tài khoản: <strong>${bankDetails.accountHolder || fullName}</strong></div>` : ''}
        ${bankDetails.notes ? `<div>• Ghi chú: <em>${bankDetails.notes}</em></div>` : ''}
      </div>
    `
    : '';

  const negotiationHtml = negotiationNote
    ? `
      <div style="background: #FFFBEB; border-left: 3px solid #D97706; border-radius: 6px; padding: 12px 16px; margin: 18px 0; font-size: 13px; color: #78350F; line-height: 1.6;">
        <strong style="display: block; margin-bottom: 4px;">✦ Biên bản đối soát thống nhất cùng Quản lý Showroom:</strong>
        ${negotiationNote}
      </div>
    `
    : '';

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E6DAC8; border-radius: 16px; overflow: hidden; color: #2C2523;">
      <div style="background: linear-gradient(135deg, #2C2523 0%, #453735 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;">
        <h1 style="font-family: 'Times New Roman', Times, serif; font-size: 26px; margin: 0; letter-spacing: 2px; color: #FDFBF7;">UNIBRIDAL</h1>
        <p style="font-size: 11px; letter-spacing: 3px; color: #B8737D; margin-top: 6px; text-transform: uppercase;">Haute Couture Bridal Atelier</p>
      </div>

      <div style="padding: 32px 28px;">
        <div style="background: #EDFBF2; border: 1px solid #C6F0D3; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center;">
          <h2 style="font-family: 'Times New Roman', Times, serif; font-size: 19px; color: #1E8347; margin: 0 0 8px 0;">
            ✓ Xác Nhận Quyết Toán & Hoàn Cọc Thành Công
          </h2>
          <p style="font-size: 13.5px; color: #514344; margin: 0; line-height: 1.6;">
            Đơn thuê lễ phục mã: <strong style="color: #1E8347;">#${orderCode}</strong>
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #514344;">
          Kính chào <strong>${fullName}</strong>,<br>
          Hệ thống UniBridal xác nhận đã hoàn tất quy trình kiểm định thu hồi lễ phục cưới và quyết toán hoàn trả khoản tiền cọc bảo lãnh: <strong style="font-size: 17px; color: #1E8347;">${formatMoney(finalRefundAmount)}</strong>.
        </p>

        ${negotiationHtml}
        ${bankHtml}

        <p style="font-size: 13.5px; line-height: 1.7; color: #514344;">
          UniBridal xin gửi lời chúc phúc sâu sắc và trân trọng cảm ơn nàng đã tin tưởng đồng hành cùng chúng tôi trong ngày trọng đại nhất cuộc đời!
        </p>
      </div>

      <div style="background: #FAF6F0; padding: 18px 24px; text-align: center; font-size: 11px; color: #847374; border-top: 1px solid #E6DAC8;">
        © 2026 UniBridal Atelier. Hotline: 0908 123 888 • 128 Đồng Khởi, Bến Nghé, Quận 1, TP. HCM
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const senderName = process.env.EMAIL_FROM_NAME || 'UniBridal Haute Couture';
      const info = await transporter.sendMail({
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `[UniBridal] Xác nhận hoàn cọc thành công - Đơn hàng #${orderCode}`,
        html,
      });
      console.log(`[EMAIL REFUND SUCCESS] Đã gửi xác nhận hoàn cọc đơn #${orderCode} tới ${to}! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL REFUND FAILED] Lỗi gửi email tới ${to}:`, err.message);
      return { simulated: true, error: err.message };
    }
  } else {
    console.log(`[EMAIL REFUND SIMULATION] To: ${to} | Order: #${orderCode}`);
    return { simulated: true };
  }
}

/**
 * Gửi email xác nhận đặt cọc thành công và thông tin hợp đồng thuê váy cưới
 */
export async function sendDepositSuccessEmail({
  to,
  fullName = 'Quý cô dâu',
  orderCode,
  contractCode,
  items = [],
  rentalStartDate,
  rentalEndDate,
  weddingDate,
  rentalDays = 4,
  totalRentPrice = 0,
  totalDeposit = 0,
  depositPaidAmount = 0,
  remainingAmount = 0,
  deliveryMethod = 'showroom',
  shippingAddress = '',
  orderDetailUrl = 'http://localhost:3000/profile/orders',
}) {
  const transporter = createTransporter();
  const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN') + ' đ';
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const itemsHtml = (items || []).map((item, idx) => `
    <tr style="border-bottom: 1px solid #F5EBE8;">
      <td style="padding: 12px 8px; vertical-align: middle; width: 36px; text-align: center; font-size: 20px;">
        👗
      </td>
      <td style="padding: 12px 10px; vertical-align: middle;">
        <div style="font-weight: 700; color: #2C2523; font-size: 14px;">${item.name || 'Váy cưới Haute Couture'}</div>
        <div style="font-size: 12px; color: #847374; margin-top: 3px;">Kích cỡ: <strong style="color: #733F49;">${item.size || 'S'}</strong></div>
      </td>
      <td style="padding: 12px 8px; vertical-align: middle; text-align: right; white-space: nowrap;">
        <div style="font-weight: 600; color: #733F49; font-size: 13.5px;">${formatMoney(item.rentPrice || 0)} / ngày</div>
        <div style="font-size: 11.5px; color: #847374; margin-top: 3px;">Cọc: ${formatMoney(item.depositAmount || 0)}</div>
      </td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #FAF5F3; border: 1px solid #EEDECF; border-radius: 16px; overflow: hidden; color: #2C2523;">
      <!-- Header thương hiệu cao cấp -->
      <div style="background: linear-gradient(135deg, #733F49 0%, #4D262F 100%); padding: 36px 24px 28px 24px; text-align: center; color: #FFFFFF;">
        <div style="display: inline-block; padding: 4px 14px; border-radius: 20px; background: rgba(212, 175, 55, 0.2); border: 1px solid #D4AF37; color: #D4AF37; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 10px;">
          ✦ HAUTE COUTURE BRIDAL ATELIER ✦
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif; font-size: 28px; margin: 0; letter-spacing: 2px; color: #FFFFFF;">UNIBRIDAL</h1>
        <p style="font-size: 12px; letter-spacing: 3px; color: #F0D5CD; margin-top: 6px; text-transform: uppercase;">Xác Nhận Giữ Váy và Đặt Cọc Thành Công</p>
      </div>

      <div style="padding: 32px 28px; background: #FFFFFF;">
        <!-- Banner lời chúc mừng -->
        <div style="background: #FFF5F2; border: 1px solid #F5DED7; border-radius: 12px; padding: 18px 20px; text-align: center; margin-bottom: 24px;">
          <h2 style="font-family: 'Times New Roman', Times, serif; font-size: 20px; color: #733F49; margin: 0 0 6px 0;">
            Chúc Mừng Nàng Đã Khóa Lịch Giữ Váy Cưới Thành Công!
          </h2>
          <p style="font-size: 13.5px; color: #514344; margin: 0; line-height: 1.6;">
            Mã đơn hàng: <strong style="color: #733F49; font-size: 15px;">#${orderCode}</strong> • Mã hợp đồng: <strong style="color: #2C2523;">${contractCode || 'HĐ-' + orderCode}</strong>
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #514344;">
          Kính chào <strong>${fullName}</strong>,<br>
          UniBridal xin chân thành cảm ơn nàng đã tin tưởng trao gửi niềm tin cho chúng tôi trong ngày trọng đại nhất cuộc đời. Giao dịch đặt cọc bảo lãnh của nàng đã được hệ thống ghi nhận thành công và thiết kế cưới độc bản đã chính thức được khóa kín lịch theo yêu cầu.
        </p>

        <!-- Lịch trình ngày cưới và thời gian bàn giao -->
        <div style="background: #FAF5F3; border-radius: 12px; border: 1px solid #EEDECF; padding: 18px 20px; margin: 22px 0;">
          <div style="font-size: 11px; font-weight: 700; color: #733F49; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
            📅 LỊCH TRÌNH THUÊ VÁY CƯỚI CỦA NÀNG
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 5px 0; color: #7A6B6C;">• Ngày nhận váy tại Atelier:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: 700; color: #2C2523;">${formatDate(rentalStartDate)}</td>
            </tr>
            ${weddingDate ? `
            <tr>
              <td style="padding: 5px 0; color: #7A6B6C;">• Ngày hôn lễ chính thức:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: 700; color: #733F49;">${formatDate(weddingDate)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 5px 0; color: #7A6B6C;">• Hạn trả váy (trước 20:00):</td>
              <td style="padding: 5px 0; text-align: right; font-weight: 700; color: #B45309;">${formatDate(rentalEndDate)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #7A6B6C;">• Tổng số ngày phục vụ:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: 700; color: #2C2523;">${rentalDays} ngày</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #7A6B6C;">• Phương thức nhận trang phục:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: 600; color: #2C2523;">${shippingAddress || 'Nhận trực tiếp tại Showroom UniBridal'}</td>
            </tr>
          </table>
        </div>

        <!-- Bảng danh sách lễ phục đã giữ lịch -->
        <div style="margin: 24px 0;">
          <div style="font-size: 11px; font-weight: 700; color: #733F49; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
            👗 CHI TIẾT THIẾT KẾ ĐÃ ĐẶT THUÊ
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <!-- Bảng thanh toán và Cọc bảo lãnh -->
        <div style="background: #FAF5F3; border: 1.5px solid #EEDECF; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr>
              <td style="padding: 6px 0; color: #7A6B6C;">Tổng tiền thuê lễ phục:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #2C2523;">${formatMoney(totalRentPrice)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #7A6B6C;">Tiền cọc bảo lãnh (Hoàn 100% khi trả):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #733F49;">${formatMoney(totalDeposit)}</td>
            </tr>
            <tr style="border-top: 1px dashed #D8C3BE;">
              <td style="padding: 10px 0 4px 0; font-weight: bold; color: #166534; font-size: 14.5px;">Số tiền cọc đã thanh toán thành công:</td>
              <td style="padding: 10px 0 4px 0; text-align: right; font-weight: 800; color: #166534; font-size: 17px;">${formatMoney(depositPaidAmount)}</td>
            </tr>
            ${remainingAmount > 0 ? `
            <tr>
              <td style="padding: 4px 0; color: #9A3412; font-size: 12.5px;">Số tiền còn lại thanh toán khi nhận váy:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: 700; color: #9A3412; font-size: 13.5px;">${formatMoney(remainingAmount)}</td>
            </tr>` : ''}
          </table>
        </div>

        <!-- Đặc quyền và Lời nhắc nhở -->
        <div style="background: #F0FDF4; border-left: 4px solid #16A34A; padding: 14px 16px; border-radius: 0 10px 10px 0; margin: 22px 0;">
          <div style="font-weight: 700; color: #166534; font-size: 13px; margin-bottom: 4px;">✦ ĐẶC QUYỀN HỖ TRỢ MIỄN PHÍ DÀNH CHO NÀNG:</div>
          <p style="font-size: 12.5px; line-height: 1.6; color: #14532D; margin: 0;">
            1. Váy được giặt hấp sấy chuyên sâu tiệt trùng và ủi phẳng phom dáng trước 24 giờ nhận.<br>
            2. Miễn phí chỉnh sửa bóp/nới eo theo số đo mới nhất của cô dâu trước ngày cưới.<br>
            3. Đóng gói bảo quản bằng Vali và Túi chống bụi cao cấp chuyên dụng cho cô dâu.
          </p>
        </div>

        <!-- Nút CTA xem hợp đồng điện tử -->
        <div style="text-align: center; margin: 34px 0 20px 0;">
          <a href="${orderDetailUrl}" style="display: inline-block; background: linear-gradient(135deg, #733F49 0%, #54222B 100%); color: #FFFFFF; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 700; font-size: 14px; box-shadow: 0 6px 18px rgba(115, 63, 73, 0.28); letter-spacing: 0.5px;">
            ✦ Xem Hợp Đồng Số và Chi Tiết Đơn Hàng
          </a>
        </div>
      </div>

      <!-- Footer chân thư -->
      <div style="background: #FAF0EC; padding: 22px 24px; text-align: center; font-size: 11.5px; color: #847374; border-top: 1px solid #EEDECF; line-height: 1.6;">
        <strong>UniBridal Haute Couture Atelier</strong><br>
        ✦ Flagship Showroom: 128 Đồng Khởi, Bến Nghé, Quận 1, TP. HCM • Hotline VIP: 1800 8998<br>
        ✦ Heritage Showroom: 45 Tràng Tiền, Hoàn Kiếm, Hà Nội • Hotline VIP: 1800 8999
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const senderName = process.env.EMAIL_FROM_NAME || 'UniBridal Haute Couture';
      const info = await transporter.sendMail({
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `[UniBridal] Xác nhận đặt cọc thành công và Hợp đồng thuê váy #${orderCode}`,
        html,
      });
      console.log(`[EMAIL DEPOSIT SUCCESS] Đã gửi xác nhận cọc đơn #${orderCode} tới ${to}! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL DEPOSIT FAILED] Lỗi gửi email tới ${to}:`, err.message);
      return { simulated: true, error: err.message };
    }
  } else {
    console.log(`[EMAIL DEPOSIT SIMULATION] To: ${to} | Order: #${orderCode}`);
    return { simulated: true };
  }
}

/**
 * Gửi email thư mời danh dự thử váy Private Suite 1:1 và mã QR Check-in
 */
export async function sendAppointmentSuccessEmail({
  to,
  fullName = 'Quý cô dâu',
  appointmentCode,
  appointmentDate,
  timeSlot,
  branchName = 'UniBridal Flagship Showroom Q.1 TP.HCM',
  branchAddress = '128 Đồng Khởi, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  branchPhone = '028 3822 8998',
  guestsCount = 1,
  interestedDresses = [],
  vipServices = [],
  stylistName = 'Chuyên Viên Stylist UniBridal',
  notes = '',
  googleCalendarUrl = '',
}) {
  const transporter = createTransporter();
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = daysOfWeek[d.getDay()];
      return `${dayName}, ngày ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const dressesHtml = (interestedDresses || []).map((dress, idx) => `
    <table style="width: 100%; border-collapse: collapse; background: #FFFFFF; border: 1px solid #EEDECF; border-radius: 10px; margin-bottom: 8px;">
      <tr>
        <td style="width: 38px; text-align: center; vertical-align: middle; padding: 12px 6px 12px 14px; font-size: 20px;">
          👗
        </td>
        <td style="padding: 12px 14px 12px 4px; vertical-align: middle;">
          <div style="font-weight: 700; color: #2C2523; font-size: 14px; line-height: 1.4;">
            ${dress.name || 'Mẫu váy cưới cao cấp'}
          </div>
          <div style="font-size: 12px; color: #733F49; margin-top: 3px;">
            Mã: <strong>${dress.code || dress.id || 'VIP'}</strong>${dress.silhouette ? ` • Phom dáng: <strong>${dress.silhouette}</strong>` : ''}
          </div>
        </td>
      </tr>
    </table>
  `).join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #FAF5F3; border: 1.5px solid #D4AF37; border-radius: 16px; overflow: hidden; color: #2C2523; box-shadow: 0 8px 30px rgba(115, 63, 73, 0.08);">
      <!-- Dải ruy băng mạ vàng phong cách thiệp mời danh dự -->
      <div style="height: 6px; background: linear-gradient(90deg, #733F49 0%, #D4AF37 50%, #B8737D 100%);"></div>

      <!-- Header thiệp mời VIP -->
      <div style="background: linear-gradient(135deg, #733F49 0%, #4D262F 100%); padding: 34px 24px; text-align: center; color: #FFFFFF;">
        <div style="display: inline-block; padding: 4px 14px; border-radius: 20px; background: rgba(212, 175, 55, 0.2); border: 1px solid #D4AF37; color: #D4AF37; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 8px;">
          ✦ VIP PRIVATE ATELIER INVITATION ✦
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif; font-size: 24px; font-weight: 700; margin: 0; color: #FFFFFF; letter-spacing: normal;">GIẤY MỜI DANH DỰ THỬ ÁO CƯỚI</h1>
        <p style="font-size: 12px; letter-spacing: 2px; color: #F0D5CD; margin-top: 6px; text-transform: uppercase;">Trải Nghiệm Phòng Thử Độc Bản 1:1 Cùng NTK</p>
      </div>

      <div style="padding: 30px 28px; background: #FFFFFF;">
        <!-- Hộp thẻ Check-in VIP -->
        <div style="background: #FFF9F7; border: 2px dashed #D4AF37; border-radius: 14px; padding: 18px 20px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 700; color: #847374; text-transform: uppercase; letter-spacing: 1.5px;">MÃ CHECK-IN DANH DỰ TẠI QUẦY LỄ TÂN</div>
          <div style="font-family: monospace; font-size: 26px; font-weight: 800; color: #733F49; letter-spacing: 3px; margin: 8px 0;">
            ${appointmentCode}
          </div>
          <div style="font-size: 12px; color: #6B5C5D;">
            Quý cô chỉ cần đưa mã này tại quầy để được chuyên viên hướng dẫn bước thẳng vào Private Suite.
          </div>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #514344;">
          Kính gửi Quý cô dâu <strong>${fullName}</strong>,<br>
          Không gian thử váy riêng tư Haute Couture của UniBridal đã được chuẩn bị chu đáo để đón chào nàng và người thân đến với buổi trải nghiệm thử váy riêng tư 90 phút trọn vẹn:
        </p>

        <!-- Khối chi tiết lịch hẹn -->
        <div style="background: #FAF5F3; border-radius: 12px; border: 1px solid #EEDECF; padding: 20px; margin: 22px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
            <tr>
              <td style="padding: 7px 0; color: #7A6B6C; width: 140px;">📅 Ngày thử váy:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #733F49; font-size: 14.5px;">${formatDate(appointmentDate)}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #7A6B6C;">⏰ Khung giờ phục vụ:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #2C2523;">${timeSlot} (90 phút riêng tư)</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #7A6B6C;">📍 Showroom đón tiếp:</td>
              <td style="padding: 7px 0; font-weight: 700; color: #2C2523;">
                ${branchName}<br>
                <span style="font-weight: 400; font-size: 12.5px; color: #6B5C5D;">${branchAddress}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #7A6B6C;">👥 Số người đồng hành:</td>
              <td style="padding: 7px 0; font-weight: 600; color: #2C2523;">${guestsCount} khách (Cô dâu)</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #7A6B6C;">👩‍💼 Stylist phụ trách:</td>
              <td style="padding: 7px 0; font-weight: 600; color: #733F49;">${stylistName} (Hotline hỗ trợ: ${branchPhone})</td>
            </tr>
          </table>
        </div>

        <!-- Danh sách mẫu váy nàng đã chọn trước -->
        ${interestedDresses && interestedDresses.length > 0 ? `
        <div style="margin: 22px 0;">
          <div style="font-size: 11px; font-weight: 700; color: #733F49; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">
            ✦ CÁC THIẾT KẾ ĐÃ ĐƯỢC ỦI PHẲNG SẴN SÀNG ĐỂ NÀNG THỬ:
          </div>
          ${dressesHtml}
        </div>
        ` : ''}

        <!-- Ghi chú riêng từ cô dâu nếu có -->
        ${notes ? `
        <div style="background: #FFF9F7; border-left: 3px solid #D4AF37; padding: 10px 14px; font-size: 12.5px; color: #6B5C5D; margin: 18px 0; font-style: italic;">
          "Ghi chú từ cô dâu: ${notes}"
        </div>
        ` : ''}

        <!-- Lời dặn dò cô dâu -->
        <div style="background: #FFF5F2; border-radius: 10px; padding: 14px 18px; margin: 22px 0; font-size: 12.5px; line-height: 1.6; color: #733F49;">
          <strong>✦ Mẹo nhỏ dành cho nàng:</strong> Nàng nên mang theo giày cao gót có độ cao dự kiến mang trong hôn lễ và trang điểm nhẹ nhàng để chuyên viên tư vấn tạo kiểu voan cài tóc hài hòa nhất.
        </div>

        <!-- Nút hành động thêm vào lịch -->
        ${googleCalendarUrl ? `
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${googleCalendarUrl}" target="_blank" style="display: inline-block; background: #733F49; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 50px; font-weight: 700; font-size: 13.5px; box-shadow: 0 4px 14px rgba(115, 63, 73, 0.25);">
            📅 Thêm Lịch Hẹn Vào Google Calendar
          </a>
        </div>
        ` : ''}
      </div>

      <!-- Footer chân thư -->
      <div style="background: #FAF0EC; padding: 20px 24px; text-align: center; font-size: 11.5px; color: #847374; border-top: 1px solid #EEDECF; line-height: 1.6;">
        <strong>UniBridal Atelier — Độc Quyền Trải Nghiệm Lễ Phục Hoàng Gia</strong><br>
        Nếu nàng cần đổi khung giờ hẹn, vui lòng liên hệ hotline <strong>${branchPhone}</strong> trước ít nhất 12 giờ để được hỗ trợ tốt nhất.
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const senderName = process.env.EMAIL_FROM_NAME || 'UniBridal Haute Couture';
      const info = await transporter.sendMail({
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `[UniBridal] Thư mời danh dự thử váy Private Suite - Mã Check-in #${appointmentCode}`,
        html,
      });
      console.log(`[EMAIL APPOINTMENT SUCCESS] Đã gửi giấy mời thử váy #${appointmentCode} tới ${to}! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL APPOINTMENT FAILED] Lỗi gửi email tới ${to}:`, err.message);
      return { simulated: true, error: err.message };
    }
  } else {
    console.log(`[EMAIL APPOINTMENT SIMULATION] To: ${to} | Appointment: #${appointmentCode}`);
    return { simulated: true };
  }
}

