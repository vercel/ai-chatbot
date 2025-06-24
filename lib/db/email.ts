// lib/db/email.ts - Complete email service
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verify your email - CoCo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset your password - CoCo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">Reset Your Password</h1>
          <p style="color: #666; font-size: 16px;">You requested to reset your password for your CoCo account.</p>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center;">
          <p style="color: #333; margin-bottom: 20px; font-size: 16px;">Click the button below to reset your password:</p>
          <a href="${resetUrl}" 
             style="display: inline-block; background-color: #00B24B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #007bff; font-size: 14px; word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
          <p style="color: #999; font-size: 12px; margin-bottom: 5px;">
            This password reset link expires in 1 hour.
          </p>
          <p style="color: #999; font-size: 12px;">
            If you didn't request this reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}