import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetOtp(to: string, fullName: string, otp: string) {
    const htmlTemplate = `                                                                                                                                                                                         
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">                                      
            <h2 style="color: #1e293b; text-align: center; margin-bottom: 20px;">Password Reset Request</h2>                                                                                                           
            <p style="color: #475569; font-size: 15px;">Hi <strong>${fullName}</strong>,</p>                                                                                                                           
            <p style="color: #475569; font-size: 15px;">We received a request to reset your password for your Task App account. Use the verification code below to proceed:</p>                                        
                                                                                                                                                                                                                       
            <div style="text-align: center; margin: 30px 0;">                                                                                                                                                          
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background-color: #eff6ff; padding: 12px 24px; border-radius: 8px; border: 1px dashed #bfdbfe; display: inline-    
  block;">                                                                                                                                                                                                             
                ${otp}                                                                                                                                                                                                 
              </span>                                                                                                                                                                                                  
            </div>                                                                                                                                                                                                     
                                                                                                                                                                                                                       
            <p style="color: #64748b; font-size: 13px; text-align: center;">⏱️ This code will expire in <strong>10 minutes</strong>.</p>                                                                               
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />                                                                                                                                
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">If you didn't request a password reset, you can safely ignore this email.</p>                                                              
          </div>                                                                                                                                                                                                       
        `;

    // 👈 Always log the code in console for instant testing
    this.logger.log(
      `📧 [EMAIL OTP] Sent to: ${to} | Verification Code: ${otp}`,
    );

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"Task App" <${process.env.SMTP_USER}>`,
        to,
        subject: `Your Password Reset Code: ${otp}`,
        html: htmlTemplate,
      });
    } catch (error) {
      this.logger.warn(`SMTP delivery warning: ${error.message}`);
    }
  }
}
