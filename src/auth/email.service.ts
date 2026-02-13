import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    const smtpHost = this.configService.get('SMTP_HOST');

    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT'),
        secure: this.configService.get<boolean>('SMTP_SECURE'),
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASSWORD'),
        },
      });
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL') || 'http://localhost:3000'}/verify-email?token=${token}`;

    if (!this.transporter) {
      this.logger.log(`[DEV MODE] Verification email for ${email}:`);
      this.logger.log(`URL: ${verificationUrl}`);
      this.logger.log(`Token: ${token}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_FROM'),
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Email Verification</h1>
        <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    this.logger.log(`Verification email sent to ${email}`);
  }
}
