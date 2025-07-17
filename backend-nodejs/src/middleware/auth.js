const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const { User, Profile } = require('../models');
const { ApiError, asyncHandler } = require('./errorHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);
  
  const decoded = verifyAccessToken(token);
  
  const user = await User.findActiveById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User not found or inactive');
  }
  
  // Update last login time
  user.lastLoginAt = new Date();
  await user.save();
  
  req.user = user;
  next();
});

const requireAuth = authenticate;

const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    req.user = null;
    return next();
  }
  
  try {
    const token = extractTokenFromHeader(authHeader);
    const decoded = verifyAccessToken(token);
    
    const user = await User.findActiveById(decoded.id);
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }
  
  next();
});

const loadUserProfile = asyncHandler(async (req, res, next) => {
  if (req.user) {
    const profile = await Profile.findByUserId(req.user.id);
    req.user.profile = profile;
  }
  next();
});

const requireEmailVerification = asyncHandler(async (req, res, next) => {
  if (!req.user.emailVerifiedAt) {
    throw new ApiError(403, 'Email verification required');
  }
  next();
});

const checkOwnership = (Model, paramKey = 'id', foreignKey = 'userId') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[paramKey];
    const resource = await Model.findByPk(resourceId);
    
    if (!resource) {
      throw new ApiError(404, 'Resource not found');
    }
    
    if (resource[foreignKey] !== req.user.id) {
      throw new ApiError(403, 'You can only access your own resources');
    }
    
    req.resource = resource;
    next();
  });
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  requireAuth,
  optionalAuth,
  loadUserProfile,
  requireEmailVerification,
  checkOwnership,
  checkRole
}; 