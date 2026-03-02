const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
  signup, login, forgotPassword, verifyOtp,
  resetPassword, getProfile, googleCallback, otpLimiter
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ─── Auth Routes ─────────────────────────────────────
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);

// ─── Google OAuth Routes ──────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed` }),
  googleCallback
);

module.exports = router;