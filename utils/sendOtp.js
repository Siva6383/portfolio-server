const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpEmail = async (email, otp, name) => {
  const mailOptions = {
    from: `"Kishore Portfolio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Your OTP for Password Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4ff; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(99,102,241,0.15); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
          .body { padding: 32px; text-align: center; }
          .otp-box { background: linear-gradient(135deg, #f0f4ff, #e8eaff); border: 2px dashed #667eea; border-radius: 12px; padding: 24px; margin: 24px 0; }
          .otp-code { font-size: 42px; font-weight: 800; color: #667eea; letter-spacing: 10px; font-family: monospace; }
          .expiry { color: #ef4444; font-weight: 600; font-size: 14px; margin-top: 8px; }
          .footer { background: #f8faff; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
          p { color: #374151; line-height: 1.7; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset OTP</h1>
          </div>
          <div class="body">
            <p>Hi <strong>${name}</strong>,</p>
            <p>You requested a password reset. Use the OTP below to proceed:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <p class="expiry">⏰ Expires in 5 minutes</p>
            </div>
            <p style="font-size:13px; color:#6b7280;">If you didn't request this, please ignore this email. Your account is safe.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Kishore S Portfolio. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };