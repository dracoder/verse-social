const { Profile, User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const { profileValidation } = require('../utils/validation');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Get user's own profile
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({
    where: { userId: req.user.id },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'isActive', 'createdAt']
      }
    ]
  });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  res.json({
    success: true,
    data: profile
  });
});

// Get profile by ID
const getProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const profile = await Profile.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'isActive', 'createdAt']
      }
    ]
  });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  // Check privacy settings
  const canView = await profile.canView(req.user?.id);
  if (!canView) {
    throw new ApiError(403, 'You do not have permission to view this profile');
  }

  // Filter sensitive data based on privacy settings
  const filteredProfile = profile.filterForUser(req.user?.id);

  res.json({
    success: true,
    data: filteredProfile
  });
});

// Update profile
const updateProfile = asyncHandler(async (req, res) => {
  const { error } = profileValidation.update.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const profile = await Profile.findOne({
    where: { userId: req.user.id }
  });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  const updateData = { ...req.body };
  
  // Handle nested objects properly
  if (updateData.personalInfo) {
    updateData.personalInfo = {
      ...profile.personalInfo,
      ...updateData.personalInfo
    };
  }

  if (updateData.socialLinks) {
    updateData.socialLinks = {
      ...profile.socialLinks,
      ...updateData.socialLinks
    };
  }

  if (updateData.preferences) {
    updateData.preferences = {
      ...profile.preferences,
      ...updateData.preferences
    };
  }

  if (updateData.privacySettings) {
    updateData.privacySettings = {
      ...profile.privacySettings,
      ...updateData.privacySettings
    };
  }

  if (updateData.customization) {
    updateData.customization = {
      ...profile.customization,
      ...updateData.customization
    };
  }

  if (updateData.widgets) {
    updateData.widgets = {
      ...profile.widgets,
      ...updateData.widgets
    };
  }

  await profile.update(updateData);

  logger.info(`Profile updated for user ${req.user.id}`, {
    userId: req.user.id,
    profileId: profile.id,
    updatedFields: Object.keys(updateData)
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: profile
  });
});

// Update avatar
const updateAvatar = asyncHandler(async (req, res) => {
  const { avatarUrl } = req.body;

  if (!avatarUrl) {
    throw new ApiError(400, 'Avatar URL is required');
  }

  const profile = await Profile.findOne({
    where: { userId: req.user.id }
  });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  await profile.update({ avatarUrl });

  logger.info(`Avatar updated for user ${req.user.id}`, {
    userId: req.user.id,
    profileId: profile.id,
    avatarUrl
  });

  res.json({
    success: true,
    message: 'Avatar updated successfully',
    data: { avatarUrl: profile.avatarUrl }
  });
});

// Update cover photo
const updateCoverPhoto = asyncHandler(async (req, res) => {
  const { coverPhotoUrl } = req.body;

  if (!coverPhotoUrl) {
    throw new ApiError(400, 'Cover photo URL is required');
  }

  const profile = await Profile.findOne({
    where: { userId: req.user.id }
  });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  await profile.update({ coverPhotoUrl });

  logger.info(`Cover photo updated for user ${req.user.id}`, {
    userId: req.user.id,
    profileId: profile.id,
    coverPhotoUrl
  });

  res.json({
    success: true,
    message: 'Cover photo updated successfully',
    data: { coverPhotoUrl: profile.coverPhotoUrl }
  });
});

// Update theme
const updateTheme = asyncHandler(async (req, res) => {
  const { error } = profileValidation.theme.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const profile = await Profile.findOne({
    where: { userId: req.user.id }
  });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  const currentCustomization = profile.customization || {};
  const updatedCustomization = {
    ...currentCustomization,
    theme: {
      ...currentCustomization.theme,
      ...req.body
    }
  };

  await profile.update({ customization: updatedCustomization });

  logger.info(`Theme updated for user ${req.user.id}`, {
    userId: req.user.id,
    profileId: profile.id,
    theme: req.body
  });

  res.json({
    success: true,
    message: 'Theme updated successfully',
    data: { theme: updatedCustomization.theme }
  });
});

// Search profiles
const searchProfiles = asyncHandler(async (req, res) => {
  const { error } = profileValidation.search.validate(req.query);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const { 
    q, 
    page = 1, 
    limit = 20, 
    city, 
    country, 
    verified,
    sortBy = 'relevance'
  } = req.query;

  const offset = (page - 1) * limit;

  // Build search conditions
  const searchConditions = [];
  
  if (q) {
    searchConditions.push({
      [Op.or]: [
        { displayName: { [Op.iLike]: `%${q}%` } },
        { username: { [Op.iLike]: `%${q}%` } },
        { bio: { [Op.iLike]: `%${q}%` } },
        { tagline: { [Op.iLike]: `%${q}%` } }
      ]
    });
  }

  if (city) {
    searchConditions.push({
      'personalInfo.location.city': { [Op.iLike]: `%${city}%` }
    });
  }

  if (country) {
    searchConditions.push({
      'personalInfo.location.country': { [Op.iLike]: `%${country}%` }
    });
  }

  if (verified !== undefined) {
    searchConditions.push({ isVerified: verified === 'true' });
  }

  // Privacy filter - only show public profiles or friends
  const privacyConditions = {
    [Op.or]: [
      { 'privacySettings.profileVisibility': 'public' },
      // Add friends logic here when relationships are implemented
    ]
  };

  const whereCondition = searchConditions.length > 0 
    ? { [Op.and]: [...searchConditions, privacyConditions] }
    : privacyConditions;

  // Determine sort order
  let order = [];
  switch (sortBy) {
    case 'name':
      order = [['displayName', 'ASC']];
      break;
    case 'newest':
      order = [['createdAt', 'DESC']];
      break;
    case 'verified':
      order = [['isVerified', 'DESC'], ['displayName', 'ASC']];
      break;
    default: // relevance
      order = [['updatedAt', 'DESC']];
  }

  const { count, rows: profiles } = await Profile.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'isActive', 'createdAt']
      }
    ],
    order,
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true
  });

  // Filter profiles based on privacy settings
  const filteredProfiles = profiles.map(profile => 
    profile.filterForUser(req.user?.id)
  );

  res.json({
    success: true,
    data: {
      profiles: filteredProfiles,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Get profile stats
const getProfileStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const profile = await Profile.findByPk(id);
  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  // Check if user can view this profile
  const canView = await profile.canView(req.user?.id);
  if (!canView) {
    throw new ApiError(403, 'You do not have permission to view this profile');
  }

  const stats = await profile.getStats();

  res.json({
    success: true,
    data: stats
  });
});

// Update privacy settings
const updatePrivacySettings = asyncHandler(async (req, res) => {
  const { error } = profileValidation.privacy.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const profile = await Profile.findOne({
    where: { userId: req.user.id }
  });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  const currentPrivacySettings = profile.privacySettings || {};
  const updatedPrivacySettings = {
    ...currentPrivacySettings,
    ...req.body
  };

  await profile.update({ privacySettings: updatedPrivacySettings });

  logger.info(`Privacy settings updated for user ${req.user.id}`, {
    userId: req.user.id,
    profileId: profile.id,
    settings: req.body
  });

  res.json({
    success: true,
    message: 'Privacy settings updated successfully',
    data: { privacySettings: updatedPrivacySettings }
  });
});

// Update widget layout
const updateWidgetLayout = asyncHandler(async (req, res) => {
  const { error } = profileValidation.widgets.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const profile = await Profile.findOne({
    where: { userId: req.user.id }
  });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  const currentWidgets = profile.widgets || {};
  const updatedWidgets = {
    ...currentWidgets,
    ...req.body
  };

  await profile.update({ widgets: updatedWidgets });

  logger.info(`Widget layout updated for user ${req.user.id}`, {
    userId: req.user.id,
    profileId: profile.id,
    widgets: req.body
  });

  res.json({
    success: true,
    message: 'Widget layout updated successfully',
    data: { widgets: updatedWidgets }
  });
});

module.exports = {
  getMyProfile,
  getProfile,
  updateProfile,
  updateAvatar,
  updateCoverPhoto,
  updateTheme,
  searchProfiles,
  getProfileStats,
  updatePrivacySettings,
  updateWidgetLayout
}; 