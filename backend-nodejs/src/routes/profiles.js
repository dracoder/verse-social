const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');

router.get('/search', searchProfiles);
router.get('/:id', getProfile);
router.get('/:id/stats', getProfileStats);

router.use(authenticate);

// User's own profile
router.get('/me/profile', getMyProfile);
router.put('/me/profile', updateProfile);
router.put('/me/avatar', updateAvatar);
router.put('/me/cover-photo', updateCoverPhoto);
router.put('/me/theme', updateTheme);
router.put('/me/privacy', updatePrivacySettings);
router.put('/me/widgets', updateWidgetLayout);

module.exports = router; 