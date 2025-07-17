const Joi = require('joi');

// User registration validation
const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot be longer than 255 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

// User login validation
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Profile update validation
const profileUpdateSchema = Joi.object({
  displayName: Joi.string()
    .min(2)
    .max(100)
    .allow('')
    .messages({
      'string.min': 'Display name must be at least 2 characters long',
      'string.max': 'Display name cannot be longer than 100 characters'
    }),
  bio: Joi.string()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Bio cannot be longer than 1000 characters'
    }),
  location: Joi.string()
    .max(255)
    .allow('')
    .messages({
      'string.max': 'Location cannot be longer than 255 characters'
    }),
  website: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Please provide a valid website URL'
    }),
  theme: Joi.string()
    .valid('default', 'dark', 'light', 'colorful', 'minimal')
    .messages({
      'any.only': 'Invalid theme selection'
    }),
  mood: Joi.string()
    .valid('happy', 'neutral', 'sad', 'excited', 'relaxed', 'busy', 'creative', 'adventurous')
    .messages({
      'any.only': 'Invalid mood selection'
    }),
  fontStyle: Joi.string()
    .valid('default', 'elegant', 'playful', 'tech', 'retro', 'minimal')
    .messages({
      'any.only': 'Invalid font style selection'
    }),
  socialLinks: Joi.object({
    twitter: Joi.string().uri().allow(''),
    instagram: Joi.string().uri().allow(''),
    linkedin: Joi.string().uri().allow(''),
    github: Joi.string().uri().allow(''),
    youtube: Joi.string().uri().allow(''),
    tiktok: Joi.string().uri().allow('')
  }).messages({
    'string.uri': 'Social links must be valid URLs'
  }),
  privacySettings: Joi.object({
    profileVisibility: Joi.string().valid('public', 'friends', 'private'),
    showEmail: Joi.boolean(),
    showLocation: Joi.boolean(),
    showOnlineStatus: Joi.boolean(),
    allowMessagesFrom: Joi.string().valid('everyone', 'friends', 'none')
  }),
  customColors: Joi.object({
    primary: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    secondary: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
    accent: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/)
  }).messages({
    'string.pattern.base': 'Colors must be valid hex codes (e.g., #FF0000)'
  }),
  profileDecorations: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      type: Joi.string().valid('sticker', 'widget', 'badge').required(),
      position: Joi.object({
        x: Joi.number().min(0).max(100),
        y: Joi.number().min(0).max(100)
      }),
      properties: Joi.object().unknown(true)
    })
  ),
  widgetsLayout: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      type: Joi.string().valid('about', 'quotes', 'music', 'calendar', 'links', 'weather').required(),
      position: Joi.number().min(0),
      enabled: Joi.boolean(),
      settings: Joi.object().unknown(true)
    })
  )
});

// Password change validation
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required'
    }),
  confirmNewPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'New passwords do not match',
      'any.required': 'New password confirmation is required'
    })
});

// Email verification
const emailVerificationSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Verification token is required'
    })
});

// Password reset request
const passwordResetRequestSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

// Password reset validation
const passwordResetSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
    }
    
    next();
  };
};

// Post creation validation
const postCreateSchema = Joi.object({
  content: Joi.string()
    .max(10000)
    .allow('')
    .messages({
      'string.max': 'Post content cannot be longer than 10,000 characters'
    }),
  groupId: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.uuid': 'Group ID must be a valid UUID'
    }),
  privacyLevel: Joi.string()
    .valid('public', 'friends', 'groups', 'private')
    .default('public')
    .messages({
      'any.only': 'Privacy level must be one of: public, friends, groups, private'
    }),
  location: Joi.string()
    .max(255)
    .allow('')
    .messages({
      'string.max': 'Location cannot be longer than 255 characters'
    }),
  feeling: Joi.string()
    .valid('happy', 'sad', 'excited', 'grateful', 'blessed', 'motivated', 'relaxed', 'thoughtful', 'creative', 'adventurous', 'nostalgic', 'peaceful')
    .allow(null)
    .messages({
      'any.only': 'Invalid feeling selection'
    }),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .messages({
      'array.max': 'Maximum 20 tags allowed',
      'string.max': 'Tags cannot be longer than 50 characters'
    }),
  scheduledFor: Joi.date()
    .greater('now')
    .allow(null)
    .messages({
      'date.greater': 'Scheduled date must be in the future'
    }),
  commentsEnabled: Joi.boolean().default(true),
  likesEnabled: Joi.boolean().default(true),
  sharingEnabled: Joi.boolean().default(true)
}).custom((value, helpers) => {
  // At least content or media must be provided (media will be handled separately)
  if (!value.content || value.content.trim().length === 0) {
    // This will be validated in the controller when media is considered
  }
  return value;
});

// Post update validation
const postUpdateSchema = Joi.object({
  content: Joi.string()
    .max(10000)
    .allow('')
    .messages({
      'string.max': 'Post content cannot be longer than 10,000 characters'
    }),
  privacyLevel: Joi.string()
    .valid('public', 'friends', 'groups', 'private')
    .messages({
      'any.only': 'Privacy level must be one of: public, friends, groups, private'
    }),
  location: Joi.string()
    .max(255)
    .allow('')
    .messages({
      'string.max': 'Location cannot be longer than 255 characters'
    }),
  feeling: Joi.string()
    .valid('happy', 'sad', 'excited', 'grateful', 'blessed', 'motivated', 'relaxed', 'thoughtful', 'creative', 'adventurous', 'nostalgic', 'peaceful')
    .allow(null)
    .messages({
      'any.only': 'Invalid feeling selection'
    }),
  tags: Joi.array()
    .items(Joi.string().max(50))
    .max(20)
    .messages({
      'array.max': 'Maximum 20 tags allowed',
      'string.max': 'Tags cannot be longer than 50 characters'
    }),
  isPinned: Joi.boolean(),
  commentsEnabled: Joi.boolean(),
  likesEnabled: Joi.boolean(),
  sharingEnabled: Joi.boolean()
});

// Comment creation validation
const commentCreateSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Comment cannot be empty',
      'string.max': 'Comment cannot be longer than 5,000 characters',
      'any.required': 'Comment content is required'
    }),
  parentId: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.uuid': 'Parent comment ID must be a valid UUID'
    }),
  mentionedUsers: Joi.array()
    .items(Joi.string().uuid())
    .max(10)
    .messages({
      'array.max': 'Maximum 10 user mentions allowed',
      'string.uuid': 'Mentioned user IDs must be valid UUIDs'
    })
});

// Comment update validation
const commentUpdateSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Comment cannot be empty',
      'string.max': 'Comment cannot be longer than 5,000 characters',
      'any.required': 'Comment content is required'
    }),
  mentionedUsers: Joi.array()
    .items(Joi.string().uuid())
    .max(10)
    .messages({
      'array.max': 'Maximum 10 user mentions allowed',
      'string.uuid': 'Mentioned user IDs must be valid UUIDs'
    })
});

// Like/reaction validation
const likeSchema = Joi.object({
  reactionType: Joi.string()
    .valid('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'care', 'celebrate', 'support', 'insightful')
    .default('like')
    .messages({
      'any.only': 'Invalid reaction type'
    })
});

// Media upload validation
const mediaSchema = Joi.object({
  type: Joi.string()
    .valid('image', 'video', 'audio', 'document')
    .required()
    .messages({
      'any.only': 'Media type must be one of: image, video, audio, document',
      'any.required': 'Media type is required'
    }),
  url: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Media URL must be a valid URL',
      'any.required': 'Media URL is required'
    }),
  filename: Joi.string().allow(null),
  size: Joi.number().positive().allow(null),
  mimeType: Joi.string().allow(null),
  thumbnail: Joi.string().uri().allow(null),
  alt: Joi.string().max(255).allow(null)
});

// Search validation
const searchSchema = Joi.object({
  query: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.min': 'Search query cannot be empty',
      'string.max': 'Search query cannot be longer than 255 characters',
      'any.required': 'Search query is required'
    }),
  type: Joi.string()
    .valid('posts', 'comments', 'users', 'groups', 'all')
    .default('all')
    .messages({
      'any.only': 'Search type must be one of: posts, comments, users, groups, all'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot be more than 100'
    }),
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Offset cannot be negative'
    })
});

// Pagination validation
const paginationSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot be more than 100'
    }),
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'Offset cannot be negative'
    }),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'likesCount', 'commentsCount', 'viewCount')
    .default('createdAt')
    .messages({
      'any.only': 'Sort field must be one of: createdAt, updatedAt, likesCount, commentsCount, viewCount'
    }),
  sortOrder: Joi.string()
    .valid('ASC', 'DESC')
    .default('DESC')
    .messages({
      'any.only': 'Sort order must be either ASC or DESC'
    })
});

// Profile validation schemas
const profileFullUpdateSchema = Joi.object({
  displayName: Joi.string().min(1).max(100),
  username: Joi.string().alphanum().min(3).max(30),
  bio: Joi.string().max(500),
  tagline: Joi.string().max(100),
  avatarUrl: Joi.string().uri(),
  coverPhotoUrl: Joi.string().uri(),
  personalInfo: Joi.object({
    birthday: Joi.date().iso(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say'),
    location: Joi.object({
      city: Joi.string().max(100),
      state: Joi.string().max(100),
      country: Joi.string().max(100),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90),
        lng: Joi.number().min(-180).max(180)
      })
    }),
    occupation: Joi.string().max(100),
    education: Joi.string().max(200),
    relationship: Joi.string().valid('single', 'in_relationship', 'married', 'complicated', 'prefer_not_to_say'),
    interests: Joi.array().items(Joi.string().max(50)).max(20),
    languages: Joi.array().items(Joi.string().max(30)).max(10)
  }),
  socialLinks: Joi.object({
    website: Joi.string().uri(),
    twitter: Joi.string().max(100),
    instagram: Joi.string().max(100),
    linkedin: Joi.string().max(100),
    github: Joi.string().max(100),
    youtube: Joi.string().max(100),
    tiktok: Joi.string().max(100)
  }),
  preferences: Joi.object({
    language: Joi.string().valid('en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh').default('en'),
    timezone: Joi.string().max(50),
    notifications: Joi.object({
      email: Joi.boolean().default(true),
      push: Joi.boolean().default(true),
      sms: Joi.boolean().default(false)
    }),
    contentFilter: Joi.string().valid('none', 'mild', 'strict').default('mild')
  }),
  privacySettings: Joi.object({
    profileVisibility: Joi.string().valid('public', 'friends', 'private').default('public'),
    searchable: Joi.boolean().default(true),
    showEmail: Joi.boolean().default(false),
    showBirthday: Joi.string().valid('everyone', 'friends', 'nobody').default('friends'),
    showLocation: Joi.string().valid('everyone', 'friends', 'nobody').default('everyone'),
    allowMessages: Joi.string().valid('everyone', 'friends', 'nobody').default('everyone'),
    allowFriendRequests: Joi.boolean().default(true)
  }),
  customization: Joi.object({
    theme: Joi.object({
      mode: Joi.string().valid('light', 'dark', 'auto').default('auto'),
      primaryColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#1976D2'),
      accentColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#FF4081'),
      backgroundImage: Joi.string().uri(),
      fontFamily: Joi.string().valid('system', 'roboto', 'opensans', 'lato', 'montserrat').default('system')
    }),
    decorations: Joi.object({
      borders: Joi.boolean().default(false),
      animations: Joi.boolean().default(true),
      gradients: Joi.boolean().default(false),
      shadows: Joi.boolean().default(true)
    }),
    layout: Joi.object({
      sidebar: Joi.string().valid('left', 'right', 'hidden').default('left'),
      compactMode: Joi.boolean().default(false),
      showActivityStatus: Joi.boolean().default(true)
    })
  }),
  widgets: Joi.object({
    enabled: Joi.array().items(
      Joi.string().valid('about', 'friends', 'photos', 'posts', 'events', 'groups', 'music', 'books', 'movies')
    ).max(10),
    layout: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        position: Joi.number().min(0).required(),
        size: Joi.string().valid('small', 'medium', 'large').default('medium')
      })
    ).max(10)
  })
});

const profileThemeSchema = Joi.object({
  mode: Joi.string().valid('light', 'dark', 'auto'),
  primaryColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  accentColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  backgroundImage: Joi.string().uri(),
  fontFamily: Joi.string().valid('system', 'roboto', 'opensans', 'lato', 'montserrat')
});

const profilePrivacySchema = Joi.object({
  profileVisibility: Joi.string().valid('public', 'friends', 'private'),
  searchable: Joi.boolean(),
  showEmail: Joi.boolean(),
  showBirthday: Joi.string().valid('everyone', 'friends', 'nobody'),
  showLocation: Joi.string().valid('everyone', 'friends', 'nobody'),
  allowMessages: Joi.string().valid('everyone', 'friends', 'nobody'),
  allowFriendRequests: Joi.boolean()
});

const profileWidgetsSchema = Joi.object({
  enabled: Joi.array().items(
    Joi.string().valid('about', 'friends', 'photos', 'posts', 'events', 'groups', 'music', 'books', 'movies')
  ).max(10),
  layout: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      position: Joi.number().min(0).required(),
      size: Joi.string().valid('small', 'medium', 'large').default('medium')
    })
  ).max(10)
});

const profileSearchSchema = Joi.object({
  q: Joi.string().min(1).max(100),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20),
  city: Joi.string().max(100),
  country: Joi.string().max(100),
  verified: Joi.string().valid('true', 'false'),
  sortBy: Joi.string().valid('relevance', 'name', 'newest', 'verified').default('relevance')
});

// Validation object groupings for easy access
const authValidation = {
  register: registerSchema,
  login: loginSchema,
  changePassword: changePasswordSchema,
  emailVerification: emailVerificationSchema,
  passwordResetRequest: passwordResetRequestSchema,
  passwordReset: passwordResetSchema
};

const postValidation = {
  create: postCreateSchema,
  update: postUpdateSchema
};

const commentValidation = {
  create: commentCreateSchema,
  update: commentUpdateSchema
};

const likeValidation = {
  create: likeSchema
};

const profileValidation = {
  update: profileFullUpdateSchema,
  theme: profileThemeSchema,
  privacy: profilePrivacySchema,
  widgets: profileWidgetsSchema,
  search: profileSearchSchema
};

// Group validation schemas
const groupCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000),
  shortDescription: Joi.string().max(200),
  privacy: Joi.string().valid('public', 'private', 'hidden').default('public'),
  joinApproval: Joi.string().valid('automatic', 'manual', 'invite_only').default('automatic'),
  category: Joi.string().max(50),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  rules: Joi.array().items(Joi.string().max(200)).max(10),
  avatarUrl: Joi.string().uri(),
  coverPhotoUrl: Joi.string().uri()
});

const groupUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(1000),
  shortDescription: Joi.string().max(200),
  privacy: Joi.string().valid('public', 'private', 'hidden'),
  joinApproval: Joi.string().valid('automatic', 'manual', 'invite_only'),
  category: Joi.string().max(50),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  rules: Joi.array().items(Joi.string().max(200)).max(10),
  avatarUrl: Joi.string().uri(),
  coverPhotoUrl: Joi.string().uri(),
  settings: Joi.object({
    postingPermissions: Joi.string().valid('all_members', 'admins_only'),
    allowDiscussions: Joi.boolean(),
    allowPolls: Joi.boolean(),
    allowEvents: Joi.boolean(),
    moderationMode: Joi.string().valid('reactive', 'proactive'),
    autoModeration: Joi.boolean()
  })
});

const groupSearchSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(20),
  category: Joi.string().max(50),
  privacy: Joi.string().valid('public', 'private'),
  featured: Joi.string().valid('true', 'false'),
  sortBy: Joi.string().valid('recent', 'name', 'members', 'activity').default('recent'),
  search: Joi.string().max(100)
});

const groupValidation = {
  create: groupCreateSchema,
  update: groupUpdateSchema,
  search: groupSearchSchema
};

const paginationValidation = paginationSchema;

module.exports = {
  registerSchema,
  loginSchema,
  profileUpdateSchema,
  changePasswordSchema,
  emailVerificationSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  postCreateSchema,
  postUpdateSchema,
  commentCreateSchema,
  commentUpdateSchema,
  likeSchema,
  mediaSchema,
  searchSchema,
  paginationSchema,
  profileFullUpdateSchema,
  profileThemeSchema,
  profilePrivacySchema,
  profileWidgetsSchema,
  profileSearchSchema,
  authValidation,
  postValidation,
  commentValidation,
  likeValidation,
  profileValidation,
  groupValidation,
  paginationValidation,
  validate
}; 