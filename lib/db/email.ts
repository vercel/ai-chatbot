import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, token: string) {
  console.log('=== EMAIL DEBUG INFO ===');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('Sending email to:', email);
  console.log('Token:', token);
  
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  console.log('Reset URL:', resetUrl);
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Reset Your Password - CoCo',
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #00B24B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this link: <br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
      </div>
    `,
  };

  try {
    console.log('Attempting to send email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}