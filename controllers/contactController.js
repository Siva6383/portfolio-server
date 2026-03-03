const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const senderUser = req.user; // from JWT middleware

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const mailOptions = {
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // sends to YOUR email
      subject: `📩 Portfolio Contact: ${subject || 'New Message'}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0f0f0f;border-radius:16px;overflow:hidden;border:1px solid rgba(212,175,55,0.2)">
          <div style="background:linear-gradient(135deg,#d4af37,#f0d060);padding:28px;text-align:center">
            <h2 style="color:#0f0f0f;margin:0;font-size:20px;font-weight:800">📩 New Portfolio Message</h2>
          </div>
          <div style="padding:32px">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:10px 0;font-size:13px;color:#a0a0a0;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:110px">From</td>
                <td style="padding:10px 0;font-size:15px;color:#f5f5f5;font-weight:600">${name}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:13px;color:#a0a0a0;font-weight:700;text-transform:uppercase;letter-spacing:1px">Email</td>
                <td style="padding:10px 0;font-size:15px;color:#d4af37">${email}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:13px;color:#a0a0a0;font-weight:700;text-transform:uppercase;letter-spacing:1px">Account</td>
                <td style="padding:10px 0;font-size:14px;color:#f5f5f5">${senderUser.email}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;font-size:13px;color:#a0a0a0;font-weight:700;text-transform:uppercase;letter-spacing:1px">Subject</td>
                <td style="padding:10px 0;font-size:15px;color:#f5f5f5">${subject || '—'}</td>
              </tr>
            </table>
            <div style="margin-top:24px;padding:20px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);border-radius:12px">
              <p style="font-size:13px;color:#a0a0a0;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Message</p>
              <p style="font-size:15px;color:#f5f5f5;line-height:1.8;margin:0">${message.replace(/\n/g, '<br/>')}</p>
            </div>
          </div>
          <div style="padding:20px;background:#0a0a0a;text-align:center;font-size:12px;color:#555;border-top:1px solid rgba(212,175,55,0.1)">
            Sent via Kishore S Portfolio Contact Form
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message. Try again.' });
  }
};
```

---

# 📁 Add Profile Photo & Resume

### For Profile Photo:
```
client/
  public/
    assets/
      profile.jpg     ← put your photo here
      Kishore_Resume.pdf  ← put your resume here