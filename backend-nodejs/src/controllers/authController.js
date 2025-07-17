const { User, Profile } = require('../models');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Register a new user
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password
  });

  // Create default profile
  const profile = await Profile.create({
    userId: user.id,
    displayName: name,
    theme: 'default',
    mood: 'neutral',
    fontStyle: 'default'
  });

  // Generate tokens
  const tokens = generateTokenPair({ id: user.id, email: user.email });

  // Save refresh token to user
  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);
  
  await user.update({
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt
  });

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        profile
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.accessTokenExpiresIn
      }
    }
  });
});

// Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findByEmail(email);
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(401, 'Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokenPair({ id: user.id, email: user.email });

  // Save refresh token to user
  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);
  
  await user.update({
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt,
    lastLoginAt: new Date()
  });

  // Get user profile
  const profile = await Profile.findByUserId(user.id);

  logger.info(`User logged in: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        lastLoginAt: user.lastLoginAt,
        profile
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.accessTokenExpiresIn
      }
    }
  });
});

// Logout user
const logout = asyncHandler(async (req, res) => {
  const user = req.user;

  // Clear refresh token
  await user.update({
    refreshToken: null,
    refreshTokenExpiresAt: null
  });

  logger.info(`User logged out: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// Refresh access token
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ApiError(401, 'Refresh token is required');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(token);

  // Find user
  const user = await User.findActiveById(decoded.id);
  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  // Check if refresh token is expired
  if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
    await user.update({
      refreshToken: null,
      refreshTokenExpiresAt: null
    });
    throw new ApiError(401, 'Refresh token expired');
  }

  // Generate new tokens
  const tokens = generateTokenPair({ id: user.id, email: user.email });

  // Update refresh token
  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);
  
  await user.update({
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt
  });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.accessTokenExpiresIn
      }
    }
  });
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  const profile = await Profile.findByUserId(user.id);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive,
        profile
      }
    }
  });
});

// Verify email (placeholder - would typically use email service)
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  // In a real implementation, you would verify the email token
  // For now, we'll just mark the current user's email as verified
  const user = req.user;
  
  await user.update({
    emailVerifiedAt: new Date()
  });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// Request password reset (placeholder)
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists or not for security
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });
  }

  // In a real implementation, you would:
  // 1. Generate a reset token
  // 2. Save it to the database with expiration
  // 3. Send an email with the reset link

  logger.info(`Password reset requested for: ${email}`);

  res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent'
  });
});

// Reset password (placeholder)
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // In a real implementation, you would:
  // 1. Verify the reset token
  // 2. Check if it's not expired
  // 3. Update the user's password
  // 4. Clear the reset token

  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  verifyEmail,
  requestPasswordReset,
  resetPassword
}; 