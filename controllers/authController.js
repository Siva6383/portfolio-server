const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendOtp');
const rateLimit = require('express-rate-limit');

// ─── Helper: Generate JWT ────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// ─── Helper: Generate 6-digit OTP ───────────────────
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Rate limiter for OTP ────────────────────────────
exports.otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: { success: false, message: 'Too many OTP requests. Try again in 15 minutes.' }
});

// ─── SIGNUP ──────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({ name, email, password: hashedPassword });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! 🎉',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── LOGIN ───────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check if Google OAuth user
    if (!user.password) {
      return res.status(401).json({ success: false, message: 'Please login with Google.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful! 👋',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── FORGOT PASSWORD (Send OTP) ───────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    const hashedOtp = await bcrypt.hash(otp, 10);
    user.otp = hashedOtp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOtpEmail(email, otp, user.name);

    res.json({ success: true, message: 'OTP sent to your email! Check your inbox. 📧' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP. Try again.' });
  }
};

// ─── VERIFY OTP ──────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

    const user = await User.findOne({ email });
    if (!user || !user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid request. Please request a new OTP.' });
    }

    // Check expiry
    if (new Date() > user.otpExpiry) {
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, user.otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // Generate a short-lived reset token
    const resetToken = jwt.sign({ id: user._id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ success: true, message: 'OTP verified! ✅', resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.type !== 'reset') throw new Error('Invalid token');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    res.json({ success: true, message: 'Password reset successfully! 🎉 Please login.' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid or expired token. Please start over.' });
  }
};

// ─── GET PROFILE ─────────────────────────────────────
exports.getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ─── GOOGLE CALLBACK ──────────────────────────────────
exports.googleCallback = (req, res) => {
  const token = generateToken(req.user._id);
  res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&id=${req.user._id}`);
};