const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { 
  validate, 
  registerSchema, 
  loginSchema,
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema
} = require('../utils/validation');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(passwordResetRequestSchema), authController.requestPasswordReset);
router.post('/reset-password', validate(passwordResetSchema), authController.resetPassword);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.getCurrentUser);
router.post('/verify-email', requireAuth, validate(emailVerificationSchema), authController.verifyEmail);

module.exports = router; 