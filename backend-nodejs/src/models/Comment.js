const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
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
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 5000] // Max 5,000 characters for comments
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
          if (value.length > 5) {
            throw new Error('Maximum 5 media items allowed in comments');
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
  isHighlighted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  highlightedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  repliesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  depth: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5 // Maximum nesting depth
    }
  },
  threadPath: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Materialized path for efficient thread queries (e.g., "1.2.3")'
  },
  mentionedUsers: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidMentions(value) {
        if (value && Array.isArray(value)) {
          value.forEach(userId => {
            if (typeof userId !== 'string') {
              throw new Error('Mentioned users must be user IDs');
            }
          });
          if (value.length > 10) {
            throw new Error('Maximum 10 user mentions allowed');
          }
        }
      }
    }
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  moderatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  moderatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'comments',
  timestamps: true,
  indexes: [
    {
      fields: ['postId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['parentId']
    },
    {
      fields: ['threadPath']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['isPinned', 'pinnedAt']
    },
    {
      fields: ['isApproved']
    }
  ],
  hooks: {
    beforeCreate: async (comment) => {
      if (comment.parentId) {
        const parent = await Comment.findByPk(comment.parentId);
        if (parent) {
          comment.depth = parent.depth + 1;
          comment.threadPath = parent.threadPath 
            ? `${parent.threadPath}.${comment.id.split('-')[0]}` 
            : comment.id.split('-')[0];
          
          // Increment parent's replies count
          await parent.increment('repliesCount');
        }
      } else {
        comment.depth = 0;
        comment.threadPath = comment.id.split('-')[0];
      }
    },
    beforeUpdate: async (comment) => {
      if (comment.changed('content') || comment.changed('media')) {
        comment.isEdited = true;
        comment.editedAt = new Date();
      }
      if (comment.changed('isPinned') && comment.isPinned) {
        comment.pinnedAt = new Date();
      } else if (comment.changed('isPinned') && !comment.isPinned) {
        comment.pinnedAt = null;
      }
      if (comment.changed('isHighlighted') && comment.isHighlighted) {
        comment.highlightedAt = new Date();
      } else if (comment.changed('isHighlighted') && !comment.isHighlighted) {
        comment.highlightedAt = null;
      }
    },
    afterDestroy: async (comment) => {
      // Decrement parent's replies count if this was a reply
      if (comment.parentId) {
        const parent = await Comment.findByPk(comment.parentId);
        if (parent && parent.repliesCount > 0) {
          await parent.decrement('repliesCount');
        }
      }
      
      // Update post comments count
      const Post = require('./Post');
      const post = await Post.findByPk(comment.postId);
      if (post && post.commentsCount > 0) {
        await post.decrementCommentsCount();
      }
    }
  }
});

// Instance methods
Comment.prototype.incrementLikesCount = function() {
  this.likesCount += 1;
  return this.save({ silent: true });
};

Comment.prototype.decrementLikesCount = function() {
  this.likesCount = Math.max(0, this.likesCount - 1);
  return this.save({ silent: true });
};

Comment.prototype.addMedia = function(mediaItem) {
  const media = this.media || [];
  if (media.length >= 5) {
    throw new Error('Maximum 5 media items allowed in comments');
  }
  
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

Comment.prototype.removeMedia = function(mediaId) {
  if (this.media) {
    this.media = this.media.filter(item => item.id !== mediaId);
    return this.save();
  }
  return Promise.resolve(this);
};

Comment.prototype.addMention = function(userId) {
  const mentions = this.mentionedUsers || [];
  if (!mentions.includes(userId) && mentions.length < 10) {
    mentions.push(userId);
    this.mentionedUsers = mentions;
    return this.save();
  }
  return Promise.resolve(this);
};

Comment.prototype.removeMention = function(userId) {
  if (this.mentionedUsers) {
    this.mentionedUsers = this.mentionedUsers.filter(id => id !== userId);
    return this.save();
  }
  return Promise.resolve(this);
};

Comment.prototype.canBeEditedBy = function(user) {
  if (!user) return false;
  if (user.id === this.userId) return true;
  // TODO: Add moderator permissions
  return false;
};

Comment.prototype.canBeDeletedBy = function(user) {
  if (!user) return false;
  if (user.id === this.userId) return true;
  // TODO: Add moderator permissions
  return false;
};

Comment.prototype.getReplies = function(limit = 10, offset = 0) {
  return Comment.findAll({
    where: {
      parentId: this.id,
      isApproved: true
    },
    order: [['createdAt', 'ASC']],
    limit,
    offset
  });
};

Comment.prototype.getThread = function() {
  const { Op } = require('sequelize');
  
  return Comment.findAll({
    where: {
      [Op.or]: [
        { threadPath: { [Op.like]: `${this.threadPath}.%` } },
        { threadPath: this.threadPath }
      ],
      isApproved: true
    },
    order: [['threadPath', 'ASC'], ['createdAt', 'ASC']]
  });
};

// Class methods
Comment.getCommentsByPost = function(postId, limit = 50, offset = 0) {
  return this.findAll({
    where: {
      postId,
      parentId: null, // Only top-level comments
      isApproved: true
    },
    order: [
      ['isPinned', 'DESC'],
      ['pinnedAt', 'DESC'],
      ['createdAt', 'ASC']
    ],
    limit,
    offset
  });
};

Comment.getCommentThread = function(postId, limit = 100, offset = 0) {
  return this.findAll({
    where: {
      postId,
      isApproved: true
    },
    order: [
      ['threadPath', 'ASC'],
      ['createdAt', 'ASC']
    ],
    limit,
    offset
  });
};

Comment.getCommentsByUser = function(userId, limit = 20, offset = 0) {
  return this.findAll({
    where: {
      userId,
      isApproved: true
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Comment.searchComments = function(query, postId = null, limit = 20, offset = 0) {
  const { Op } = require('sequelize');
  
  const where = {
    content: { [Op.iLike]: `%${query}%` },
    isApproved: true
  };
  
  if (postId) {
    where.postId = postId;
  }
  
  return this.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Comment.getRecentComments = function(limit = 20, offset = 0) {
  return this.findAll({
    where: {
      isApproved: true
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

module.exports = Comment; 