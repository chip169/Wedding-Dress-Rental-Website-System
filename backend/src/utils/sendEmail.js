import nodemailer from 'nodemailer';

/**
 * Khá»Ÿi táº¡o Transporter gá»­i email
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    // Náº¿u dÃ¹ng Gmail, service: 'gmail' lÃ  chuáº©n nháº¥t cá»§a nodemailer
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

  // Fallback transporter (hoáº·c ghi log console trong mÃ´i trÆ°á»ng dev)
  return null;
};

/**
 * Gá»­i email xÃ¡c thá»±c tÃ i khoáº£n vá»›i mÃ£ OTP 6 sá»‘
 */
export async function sendVerificationEmail(to, otp, fullName = 'QuÃ½ khÃ¡ch') {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E6DAC8; border-radius: 12px; overflow: hidden; color: #2C2523;">
      <div style="background: linear-gradient(135deg, #2C2523 0%, #453735 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; margin: 0; letter-spacing: 2px; color: #FDFBF7;">UNIBRIDAL</h1>
        <p style="font-size: 11px; letter-spacing: 3px; color: #B8737D; margin-top: 6px; text-transform: uppercase;">Haute Couture Bridal Atelier</p>
      </div>

      <div style="padding: 36px 32px;">
        <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: #2C2523; margin-top: 0;">XÃ¡c Thá»±c TÃ i Khoáº£n ÄÄƒng KÃ½</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #514344;">
          Xin chÃ o <strong>${fullName}</strong>,<br>
          Cáº£m Æ¡n báº¡n Ä‘Ã£ lá»±a chá»n UniBridal. Äá»ƒ kÃ­ch hoáº¡t tÃ i khoáº£n thÃ nh viÃªn vÃ  báº¯t Ä‘áº§u tráº£i nghiá»‡m dá»‹ch vá»¥ thuÃª vÃ¡y cÆ°á»›i cao cáº¥p, vui lÃ²ng sá»­ dá»¥ng mÃ£ xÃ¡c thá»±c OTP dÆ°á»›i Ä‘Ã¢y:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: #FFF0ED; border: 2px dashed #B8737D; border-radius: 10px; padding: 14px 36px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #854F55;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #847374; margin-top: 8px;">MÃ£ OTP cÃ³ hiá»‡u lá»±c trong vÃ²ng <strong>3 phÃºt</strong>.</p>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #847374;">
          Náº¿u báº¡n khÃ´ng thá»±c hiá»‡n yÃªu cáº§u nÃ y, vui lÃ²ng bá» qua email nÃ y hoáº·c liÃªn há»‡ hotline UniBridal <strong>0908 123 888</strong> Ä‘á»ƒ Ä‘Æ°á»£c há»— trá»£.
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
        subject: `[UniBridal] MÃ£ xÃ¡c thá»±c Ä‘Äƒng kÃ½ tÃ i khoáº£n: ${otp}`,
        html,
      });
      console.log(`[EMAIL SENT SUCCESS] Gá»­i OTP Ä‘Äƒng kÃ½ tá»›i ${to} thÃ nh cÃ´ng! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL SEND FAILED] Lá»—i gá»­i email tá»›i ${to}:`, err.message);
      console.log('====================================================');
      console.log(`[DEV OTP FALLBACK] To: ${to} | OTP: ${otp}`);
      console.log('====================================================');
      return { simulated: true, otp, error: err.message };
    }
  } else {
    console.log('====================================================');
    console.log(`[EMAIL VERIFY SIMULATION] To: ${to} | OTP: ${otp}`);
    console.log('ChÆ°a cáº¥u hÃ¬nh EMAIL_USER & EMAIL_PASS trong backend/.env Ä‘á»ƒ gá»­i email thá»±c táº¿.');
    console.log('====================================================');
    return { simulated: true, otp };
  }
}

/**
 * Gá»­i email Ä‘áº·t láº¡i máº­t kháº©u vá»›i mÃ£ OTP 6 sá»‘
 */
export async function sendResetPasswordEmail(to, otp, fullName = 'QuÃ½ khÃ¡ch') {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFBF7; border: 1px solid #E6DAC8; border-radius: 12px; overflow: hidden; color: #2C2523;">
      <div style="background: linear-gradient(135deg, #2C2523 0%, #453735 100%); padding: 32px 24px; text-align: center; color: #FFFFFF;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; margin: 0; letter-spacing: 2px; color: #FDFBF7;">UNIBRIDAL</h1>
        <p style="font-size: 11px; letter-spacing: 3px; color: #B8737D; margin-top: 6px; text-transform: uppercase;">Haute Couture Bridal Atelier</p>
      </div>

      <div style="padding: 36px 32px;">
        <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: #2C2523; margin-top: 0;">YÃªu Cáº§u Äáº·t Láº¡i Máº­t Kháº©u</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #514344;">
          Xin chÃ o <strong>${fullName}</strong>,<br>
          ChÃºng tÃ´i nháº­n Ä‘Æ°á»£c yÃªu cáº§u khÃ´i phá»¥c máº­t kháº©u cho tÃ i khoáº£n UniBridal cá»§a báº¡n. Vui lÃ²ng nháº­p mÃ£ OTP sau Ä‘á»ƒ tiáº¿n hÃ nh thiáº¿t láº­p máº­t kháº©u má»›i:
        </p>

        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background: #FFF0ED; border: 2px dashed #B8737D; border-radius: 10px; padding: 14px 36px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #854F55;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #847374; margin-top: 8px;">MÃ£ cÃ³ hiá»‡u lá»±c trong vÃ²ng <strong>3 phÃºt</strong>.</p>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #847374;">
          VÃ¬ lÃ½ do báº£o máº­t, tuyá»‡t Ä‘á»‘i khÃ´ng chia sáº» mÃ£ nÃ y cho báº¥t ká»³ ai.
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
        subject: `[UniBridal] MÃ£ xÃ¡c thá»±c Ä‘áº·t láº¡i máº­t kháº©u: ${otp}`,
        html,
      });
      console.log(`[EMAIL SENT SUCCESS] Gá»­i OTP Ä‘áº·t láº¡i máº­t kháº©u tá»›i ${to} thÃ nh cÃ´ng! MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL SEND FAILED] Lá»—i gá»­i email tá»›i ${to}:`, err.message);
      console.log('====================================================');
      console.log(`[DEV OTP FALLBACK] To: ${to} | OTP: ${otp}`);
      console.log('====================================================');
      return { simulated: true, otp, error: err.message };
    }
  } else {
    console.log('====================================================');
    console.log(`[FORGOT PASSWORD OTP SIMULATION] To: ${to} | OTP: ${otp}`);
    console.log('ChÆ°a cáº¥u hÃ¬nh EMAIL_USER & EMAIL_PASS trong backend/.env Ä‘á»ƒ gá»­i email thá»±c táº¿.');
    console.log('====================================================');
    return { simulated: true, otp };
  }
}

