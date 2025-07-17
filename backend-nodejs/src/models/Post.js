const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'groups',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 10000] // Max 10,000 characters
    }
  },
  media: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidMedia(value) {
        if (value && Array.isArray(value)) {
          value.forEach(item => {
            if (!item.type || !item.url) {
              throw new Error('Media items must have type and url');
            }
            if (!['image', 'video', 'audio', 'document'].includes(item.type)) {
              throw new Error('Invalid media type');
            }
          });
        }
      }
    }
  },
  privacyLevel: {
    type: DataTypes.ENUM,
    values: ['public', 'friends', 'groups', 'private'],
    defaultValue: 'public',
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  feeling: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['happy', 'sad', 'excited', 'grateful', 'blessed', 'motivated', 'relaxed', 'thoughtful', 'creative', 'adventurous', 'nostalgic', 'peaceful']]
    }
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidTags(value) {
        if (value && Array.isArray(value)) {
          value.forEach(tag => {
            if (typeof tag !== 'string' || tag.length > 50) {
              throw new Error('Tags must be strings with max 50 characters');
            }
          });
          if (value.length > 20) {
            throw new Error('Maximum 20 tags allowed');
          }
        }
      }
    }
  },
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pinnedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  commentsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  likesEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sharingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  sharesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  scheduledFor: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'posts',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['groupId']
    },
    {
      fields: ['privacyLevel']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['isPublished', 'scheduledFor']
    },
    {
      fields: ['isPinned', 'pinnedAt']
    }
  ],
  hooks: {
    beforeUpdate: async (post) => {
      if (post.changed('content') || post.changed('media')) {
        post.isEdited = true;
        post.editedAt = new Date();
      }
      if (post.changed('isPinned') && post.isPinned) {
        post.pinnedAt = new Date();
      } else if (post.changed('isPinned') && !post.isPinned) {
        post.pinnedAt = null;
      }
    }
  }
});

// Instance methods
Post.prototype.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save({ silent: true });
};

Post.prototype.incrementLikesCount = function() {
  this.likesCount += 1;
  return this.save({ silent: true });
};

Post.prototype.decrementLikesCount = function() {
  this.likesCount = Math.max(0, this.likesCount - 1);
  return this.save({ silent: true });
};

Post.prototype.incrementCommentsCount = function() {
  this.commentsCount += 1;
  return this.save({ silent: true });
};

Post.prototype.decrementCommentsCount = function() {
  this.commentsCount = Math.max(0, this.commentsCount - 1);
  return this.save({ silent: true });
};

Post.prototype.incrementSharesCount = function() {
  this.sharesCount += 1;
  return this.save({ silent: true });
};

Post.prototype.addMedia = function(mediaItem) {
  const media = this.media || [];
  media.push({
    id: require('crypto').randomUUID(),
    type: mediaItem.type,
    url: mediaItem.url,
    filename: mediaItem.filename || null,
    size: mediaItem.size || null,
    mimeType: mediaItem.mimeType || null,
    thumbnail: mediaItem.thumbnail || null,
    alt: mediaItem.alt || null,
    uploadedAt: new Date()
  });
  this.media = media;
  return this.save();
};

Post.prototype.removeMedia = function(mediaId) {
  if (this.media) {
    this.media = this.media.filter(item => item.id !== mediaId);
    return this.save();
  }
  return Promise.resolve(this);
};

Post.prototype.canBeViewedBy = function(user) {
  if (!this.isPublished) return false;
  if (this.scheduledFor && new Date() < this.scheduledFor) return false;
  
  switch (this.privacyLevel) {
    case 'public':
      return true;
    case 'private':
      return user && user.id === this.userId;
    case 'friends':
      // TODO: Implement friends relationship check
      return user && user.id === this.userId;
    case 'groups':
      return user && (user.id === this.userId || this.groupId);
    default:
      return false;
  }
};

Post.prototype.canBeEditedBy = function(user) {
  if (!user) return false;
  if (user.id === this.userId) return true;
  // TODO: Add group admin/moderator permissions
  return false;
};

Post.prototype.canBeDeletedBy = function(user) {
  if (!user) return false;
  if (user.id === this.userId) return true;
  // TODO: Add group admin/moderator permissions
  return false;
};

// Class methods
Post.getPublicPosts = function(limit = 20, offset = 0) {
  return this.findAll({
    where: {
      privacyLevel: 'public',
      isPublished: true,
      scheduledFor: {
        [require('sequelize').Op.or]: [
          null,
          { [require('sequelize').Op.lte]: new Date() }
        ]
      }
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Post.getPostsByUser = function(userId, viewerId = null, limit = 20, offset = 0) {
  const where = {
    userId,
    isPublished: true,
    scheduledFor: {
      [require('sequelize').Op.or]: [
        null,
        { [require('sequelize').Op.lte]: new Date() }
      ]
    }
  };

  // Privacy filtering
  if (!viewerId || viewerId !== userId) {
    where.privacyLevel = 'public';
  }

  return this.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Post.getPostsByGroup = function(groupId, limit = 20, offset = 0) {
  return this.findAll({
    where: {
      groupId,
      isPublished: true,
      scheduledFor: {
        [require('sequelize').Op.or]: [
          null,
          { [require('sequelize').Op.lte]: new Date() }
        ]
      }
    },
    order: [['isPinned', 'DESC'], ['pinnedAt', 'DESC'], ['createdAt', 'DESC']],
    limit,
    offset
  });
};

Post.searchPosts = function(query, limit = 20, offset = 0) {
  const { Op } = require('sequelize');
  
  return this.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { content: { [Op.iLike]: `%${query}%` } },
            { tags: { [Op.contains]: [query] } }
          ]
        },
        {
          privacyLevel: 'public',
          isPublished: true,
          scheduledFor: {
            [Op.or]: [
              null,
              { [Op.lte]: new Date() }
            ]
          }
        }
      ]
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

module.exports = Post; 