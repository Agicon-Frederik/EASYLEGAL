import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * Initialize the email service with configuration
   */
  initialize(config: EmailConfig): void {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not initialized. Call initialize() first.');
    }

    try {
      await this.transporter.sendMail({
        from: this.config.auth.user,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLink(
    email: string,
    name: string,
    magicLink: string,
    language: 'en' | 'fr' | 'nl'
  ): Promise<boolean> {
    const subjects = {
      en: 'Your EASYLEGAL Login Link',
      fr: 'Votre lien de connexion EASYLEGAL',
      nl: 'Uw EASYLEGAL inloglink',
    };

    const greetings = {
      en: `Hello ${name}`,
      fr: `Bonjour ${name}`,
      nl: `Hallo ${name}`,
    };

    const messages = {
      en: 'Click the button below to securely log in to EASYLEGAL. This link will expire in 15 minutes.',
      fr: 'Cliquez sur le bouton ci-dessous pour vous connecter en toute sécurité à EASYLEGAL. Ce lien expirera dans 15 minutes.',
      nl: 'Klik op de knop hieronder om veilig in te loggen op EASYLEGAL. Deze link verloopt over 15 minuten.',
    };

    const buttonTexts = {
      en: 'Login to EASYLEGAL',
      fr: 'Se connecter à EASYLEGAL',
      nl: 'Inloggen op EASYLEGAL',
    };

    const footers = {
      en: 'If you did not request this email, please ignore it.',
      fr: 'Si vous n\'avez pas demandé cet email, veuillez l\'ignorer.',
      nl: 'Als u deze e-mail niet hebt aangevraagd, negeer deze dan.',
    };

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjects[language]}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e9ecef;">
              <h1 style="margin: 0; color: #2684ff; font-size: 28px; font-weight: bold;">EASYLEGAL</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #212529; font-size: 24px; font-weight: 600;">${greetings[language]},</h2>
              <p style="margin: 0 0 24px 0; color: #6c757d; font-size: 16px; line-height: 1.6;">${messages[language]}</p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${magicLink}" style="display: inline-block; background-color: #2684ff; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(38, 132, 255, 0.2);">${buttonTexts[language]}</a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 24px 0 0 0; color: #adb5bd; font-size: 14px; line-height: 1.6;">
                ${language === 'en' ? 'Or copy and paste this link:' : language === 'fr' ? 'Ou copiez et collez ce lien :' : 'Of kopieer en plak deze link:'}
                <br>
                <a href="${magicLink}" style="color: #2684ff; word-break: break-all;">${magicLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #adb5bd; font-size: 14px;">${footers[language]}</p>
              <p style="margin: 16px 0 0 0; color: #adb5bd; font-size: 12px;">© 2025 EASYLEGAL</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject: subjects[language],
      html,
    });
  }

  /**
   * Verify the transporter configuration
   */
  async verify(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
