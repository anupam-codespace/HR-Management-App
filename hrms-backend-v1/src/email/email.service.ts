import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    // Initialize Resend with the API key from your .env or fallback for test environments
    this.resend = new Resend(
      process.env.RESEND_API_KEY || 're_placeholder_key',
    );
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    try {
      const fromEmail =
        process.env.RESEND_FROM_EMAIL || 'TeamHub HRMS <onboarding@resend.dev>';
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Reset Your Password - HRMS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #0f172a;">Password Reset Request</h2>
            <p>We received a request to reset your password for your HRMS account.</p>
            <p>Click the button below to choose a new password. <strong>This link expires in 15 minutes.</strong></p>
            
            <a href="${resetUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0; font-weight: bold;">
              Reset Password
            </a>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              If you didn't request this, please safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Failed to send password reset email via Resend:', error);
        throw new InternalServerErrorException(
          error.message || 'Failed to send email',
        );
      }

      console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      console.error(
        '❌ Failed to send password reset email via Resend:',
        error,
      );
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendEmployeeInvitationEmail(
    email: string,
    firstName: string,
    employeeCode: string | null,
    inviteToken: string,
  ) {
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/set-password?token=${inviteToken}`;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'TeamHub HRMS <onboarding@resend.dev>';
    try {
      const { data, error } = await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Welcome to the Team! Set your password',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Welcome to TeamHub, ${firstName}!</h2>
            <p>You have been invited to join your company's HRMS workspace.</p>
            ${employeeCode ? `<p>Your official Employee ID is: <strong>${employeeCode}</strong></p>` : `<p>Your official Employee ID will be assigned upon completion and verification of your onboarding checklist.</p>`}
            <p>Please click the secure link below to set your permanent password and complete your onboarding.</p>
            <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; margin-top: 15px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Set Password & Start Onboarding</a>
            <p style="margin-top: 30px; font-size: 12px; color: #888;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Resend API returned error for employee invitation:', error);
      } else {
        console.log(`✅ Onboarding invitation email sent to ${email}`);
      }
    } catch (emailError) {
      console.error(
        '❌ Failed to send onboarding invitation email via Resend:',
        emailError,
      );
      // Gracefully continue so user creation doesn't fail if SMTP/Resend key is mock
    }
  }
}
