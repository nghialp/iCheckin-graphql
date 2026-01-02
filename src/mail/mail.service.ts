import { Injectable } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendMail(to: string, subject: string, html: string) {
    const msg = {
      to,
      from: process.env.MAIL_USER || 'icheckin.verify@gmail.com',
      subject,
      html,
    };

    try {
      await sgMail.send(msg);
      return { success: true };
    } catch (error) {
      console.error('SendGrid error:', error);
      return { success: false, error };
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const verifyUrl = `https://icheckin.vn/auth/verify?token=${token}`;
    const html = `
      <h1>Xác thực tài khoản iCheckin</h1>
      <p>Nhấn vào link sau để xác thực: <a href="${verifyUrl}">${verifyUrl}</a></p>
    `;
    return this.sendMail(to, 'Xác thực tài khoản iCheckin', html);
  }

  async sendResetPasswordEmail(to: string, userName: string, newPassword: string) {
    const html = `
        <h2>Xin chào ${userName},</h2>

        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản iCheckin.</p>

        <p>Mật khẩu mới của bạn là:</p>
        <p style="font-size:18px; font-weight:bold; color:#2c3e50;">
        ${newPassword}
        </p>

        <p>Vui lòng đăng nhập bằng mật khẩu mới này và sau đó đổi lại mật khẩu để đảm bảo an toàn.</p>

        <p>Nếu bạn không thực hiện yêu cầu này, hãy liên hệ ngay với đội ngũ hỗ trợ của chúng tôi.</p>

        <hr>
        <p>Trân trọng,<br>
        Đội ngũ iCheckin</p>
    `;
    return this.sendMail(to, 'Đặt lại mật khẩu iCheckin', html);
  }
}