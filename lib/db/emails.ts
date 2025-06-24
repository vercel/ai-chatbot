// for
import nodemailer from 'nodemailer';

// Create reusable transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email provider
  auth: {
    user: process.env.EMAIL_FROM, // Your email
    pass: process.env.EMAIL_PASSWORD, // Your app password
  },
});



export async function sendVerificationEmail(email: string, otp: string): Promise<void> {
  try {
    console.log('Sending verification email to:', email, 'with OTP:', otp);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"CoCo App" <noreply@coco.com>',
      to: email,
      subject: 'Verify Your Email - CoCo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00B24B; margin: 0;">CoCo</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            <p style="color: #666; margin-bottom: 30px; font-size: 16px;">
              Please enter this verification code in the app to complete your registration:
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #00B24B;">
              <span style="font-size: 32px; font-weight: bold; color: #00B24B; letter-spacing: 8px; font-family: monospace;">
                ${otp}
              </span>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This code will expire in 15 minutes for security reasons.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't request this verification, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2025 CoCo. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
        Welcome to CoCo!
        
        Your verification code is: ${otp}
        
        Please enter this code in the app to verify your email address.
        This code will expire in 15 minutes.
        
        If you didn't request this verification, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  try {
    console.log('Sending password reset email to:', email);
    
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"CoCo App" <noreply@coco.com>',
      to: email,
      subject: 'Reset Your Password - CoCo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #00B24B; margin: 0;">CoCo</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
            <p style="color: #666; margin-bottom: 20px; font-size: 16px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #00B24B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            <p style="color: #00B24B; word-break: break-all; font-size: 14px;">
              ${resetUrl}
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This link will expire in 1 hour for security reasons.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© 2025 CoCo. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
        Reset Your Password - CoCo
        
        We received a request to reset your password.
        Click this link to create a new password: ${resetUrl}
        
        This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}