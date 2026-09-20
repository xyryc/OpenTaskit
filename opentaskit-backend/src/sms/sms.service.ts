import { Injectable, Logger } from '@nestjs/common';

export interface SendSmsResult {
  success: boolean;
  message: string;
  sandbox?: boolean;
  data?: any;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  private get userId(): string | undefined {
    return process.env.SMSLENZ_USER_ID;
  }

  private get apiKey(): string | undefined {
    return process.env.SMSLENZ_API_KEY;
  }

  private get senderId(): string {
    return process.env.SMSLENZ_SENDER_ID || 'SMSlenzDEMO';
  }

  private get isSandbox(): boolean {
    const sandboxEnv = process.env.SMS_SANDBOX_MODE;
    // Sandbox is active if explicitly set to 'true', or if credentials are not configured
    if (sandboxEnv !== undefined) {
      return sandboxEnv.toLowerCase() === 'true';
    }
    return !this.userId || !this.apiKey;
  }

  /**
   * Format any Sri Lankan phone number format into standard E.164 (+947XXXXXXXX)
   */
  formatContactNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-()]/g, '');

    // Already E.164 with +94
    if (cleaned.startsWith('+94')) {
      return cleaned;
    }

    // 947XXXXXXXX
    if (cleaned.startsWith('94') && cleaned.length >= 11) {
      return `+${cleaned}`;
    }

    // 07XXXXXXXX (standard Sri Lanka domestic format)
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return `+94${cleaned.slice(1)}`;
    }

    // 7XXXXXXXX (9 digits without leading 0)
    if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1') || cleaned.startsWith('2') || cleaned.startsWith('3') || cleaned.startsWith('4') || cleaned.startsWith('5') || cleaned.startsWith('6') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
      return `+94${cleaned}`;
    }

    // Fallback: prepend + if missing
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  /**
   * Send a single SMS via SMSLenz or log to console in sandbox mode
   */
  async sendSms(contact: string, message: string): Promise<SendSmsResult> {
    const formattedContact = this.formatContactNumber(contact);

    // Sandbox / Mock Mode
    if (this.isSandbox) {
      this.logger.log(
        `📱 [SMS SANDBOX] To: ${formattedContact} | Sender: ${this.senderId} | Message: "${message}"`,
      );
      return {
        success: true,
        sandbox: true,
        message: 'SMS logged in sandbox mode (no credits used)',
      };
    }

    // Live SMSLenz Gateway API
    try {
      this.logger.log(
        `📱 [SMSLENZ SENDING] To: ${formattedContact} | Sender: ${this.senderId}`,
      );

      const response = await fetch('https://smslenz.lk/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.userId,
          api_key: this.apiKey,
          sender_id: this.senderId,
          contact: formattedContact,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        this.logger.warn(
          `📱 [SMSLENZ ERROR] ${data?.message || response.statusText}`,
        );
        return {
          success: false,
          message: data?.message || 'Failed to send SMS via SMSLenz',
          data,
        };
      }

      this.logger.log(
        `📱 [SMSLENZ SUCCESS] To: ${formattedContact} | Balance: ${data?.data?.sms_credit_balance ?? 'N/A'}`,
      );

      return {
        success: true,
        message: data?.message || 'SMS sent successfully',
        data: data?.data,
      };
    } catch (err: any) {
      this.logger.error(`📱 [SMSLENZ NETWORK ERROR] ${err?.message || err}`);
      return {
        success: false,
        message: err?.message || 'Network error communicating with SMSLenz',
      };
    }
  }

  /**
   * Send a 6-digit OTP verification code
   */
  async sendOtp(contact: string, otp: string): Promise<SendSmsResult> {
    const message = `Your OpenTaskit verification code is ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    return this.sendSms(contact, message);
  }
}
