const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Like = sequelize.define('Like', {
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
  likeableId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID of the liked item (post, comment, etc.)'
  },
  likeableType: {
    type: DataTypes.ENUM,
    values: ['post', 'comment', 'group', 'event', 'poll'],
    allowNull: false,
    comment: 'Type of the liked item'
  },
  reactionType: {
    type: DataTypes.ENUM,
    values: [
      'like',          // 👍 Basic like
      'love',          // ❤️ Love
      'laugh',         // 😂 Laugh/Funny
      'wow',           // 😮 Surprise/Wow
      'sad',           // 😢 Sad
      'angry',         // 😠 Angry
      'care',          // 🤗 Care/Hug
      'celebrate',     // 🎉 Celebrate
      'support',       // 💪 Support
      'insightful'     // 💡 Insightful
    ],
    defaultValue: 'like',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the like is currently active (for toggle functionality)'
  },
  intensity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Intensity of the reaction (1-5, for future features)'
  }
}, {
  tableName: 'likes',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['likeableId', 'likeableType']
    },
    {
      fields: ['reactionType']
    },
    {
      fields: ['isActive']
    },
    {
      unique: true,
      fields: ['userId', 'likeableId', 'likeableType'],
      name: 'unique_user_likeable'
    }
  ]
});

// Instance methods
Like.prototype.toggle = async function() {
  this.isActive = !this.isActive;
  await this.save();
  
  // Update the likeable item's count
  await this.updateLikeableCount();
  
  return this;
};

Like.prototype.changeReaction = async function(newReactionType) {
  const oldReaction = this.reactionType;
  this.reactionType = newReactionType;
  this.isActive = true;
  await this.save();
  
  // Emit event for reaction change analytics
  // TODO: Implement event system
  
  return this;
};

Like.prototype.updateLikeableCount = async function() {
  const modelMap = {
    post: require('./Post'),
    comment: require('./Comment')
    // TODO: Add other models when they're created
  };
  
  const Model = modelMap[this.likeableType];
  if (!Model) return;
  
  const item = await Model.findByPk(this.likeableId);
  if (!item) return;
  
  if (this.isActive) {
    await item.incrementLikesCount();
  } else {
    await item.decrementLikesCount();
  }
};

Like.prototype.getLikeableItem = async function() {
  const modelMap = {
    post: require('./Post'),
    comment: require('./Comment')
    // TODO: Add other models when they're created
  };
  
  const Model = modelMap[this.likeableType];
  if (!Model) return null;
  
  return await Model.findByPk(this.likeableId);
};

// Class methods
Like.findByUserAndLikeable = function(userId, likeableId, likeableType) {
  return this.findOne({
    where: {
      userId,
      likeableId,
      likeableType
    }
  });
};

Like.likeItem = async function(userId, likeableId, likeableType, reactionType = 'like') {
  // Check if like already exists
  let like = await this.findByUserAndLikeable(userId, likeableId, likeableType);
  
  if (like) {
    if (like.isActive && like.reactionType === reactionType) {
      // Toggle off if same reaction
      await like.toggle();
      return { like, action: 'removed' };
    } else if (like.isActive && like.reactionType !== reactionType) {
      // Change reaction type
      await like.changeReaction(reactionType);
      return { like, action: 'changed' };
    } else if (!like.isActive) {
      // Reactivate with new reaction
      like.reactionType = reactionType;
      await like.toggle();
      return { like, action: 'added' };
    }
  } else {
    // Create new like
    like = await this.create({
      userId,
      likeableId,
      likeableType,
      reactionType,
      isActive: true
    });
    
    await like.updateLikeableCount();
    return { like, action: 'added' };
  }
};

Like.unlikeItem = async function(userId, likeableId, likeableType) {
  const like = await this.findByUserAndLikeable(userId, likeableId, likeableType);
  
  if (like && like.isActive) {
    await like.toggle();
    return { like, action: 'removed' };
  }
  
  return { like: null, action: 'not_found' };
};

Like.getLikesForItem = function(likeableId, likeableType, limit = 50, offset = 0) {
  return this.findAll({
    where: {
      likeableId,
      likeableType,
      isActive: true
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Like.getLikesSummaryForItem = async function(likeableId, likeableType) {
  const { Op } = require('sequelize');
  
  const likes = await this.findAll({
    where: {
      likeableId,
      likeableType,
      isActive: true
    },
    attributes: [
      'reactionType',
      [sequelize.fn('COUNT', sequelize.col('reactionType')), 'count']
    ],
    group: ['reactionType'],
    raw: true
  });
  
  const total = likes.reduce((sum, like) => sum + parseInt(like.count), 0);
  
  return {
    total,
    reactions: likes.reduce((acc, like) => {
      acc[like.reactionType] = parseInt(like.count);
      return acc;
    }, {})
  };
};

Like.getUserLikesForItem = function(userId, likeableId, likeableType) {
  return this.findOne({
    where: {
      userId,
      likeableId,
      likeableType,
      isActive: true
    }
  });
};

Like.getUserLikes = function(userId, likeableType = null, limit = 20, offset = 0) {
  const where = {
    userId,
    isActive: true
  };
  
  if (likeableType) {
    where.likeableType = likeableType;
  }
  
  return this.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });
};

Like.getPopularItems = async function(likeableType, timeframe = '7days', limit = 10) {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (timeframe) {
    case '24hours':
      dateFilter = { [Op.gte]: new Date(now - 24 * 60 * 60 * 1000) };
      break;
    case '7days':
      dateFilter = { [Op.gte]: new Date(now - 7 * 24 * 60 * 60 * 1000) };
      break;
    case '30days':
      dateFilter = { [Op.gte]: new Date(now - 30 * 24 * 60 * 60 * 1000) };
      break;
    case 'all':
      dateFilter = {};
      break;
  }
  
  const where = {
    likeableType,
    isActive: true
  };
  
  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter;
  }
  
  return this.findAll({
    where,
    attributes: [
      'likeableId',
      [sequelize.fn('COUNT', sequelize.col('likeableId')), 'likesCount'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'uniqueUsers']
    ],
    group: ['likeableId'],
    order: [[sequelize.literal('likesCount'), 'DESC']],
    limit,
    raw: true
  });
};

Like.getReactionStats = async function(timeframe = '7days') {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (timeframe) {
    case '24hours':
      dateFilter = { [Op.gte]: new Date(now - 24 * 60 * 60 * 1000) };
      break;
    case '7days':
      dateFilter = { [Op.gte]: new Date(now - 7 * 24 * 60 * 60 * 1000) };
      break;
    case '30days':
      dateFilter = { [Op.gte]: new Date(now - 30 * 24 * 60 * 60 * 1000) };
      break;
  }
  
  const where = { isActive: true };
  if (Object.keys(dateFilter).length > 0) {
    where.createdAt = dateFilter;
  }
  
  return this.findAll({
    where,
    attributes: [
      'reactionType',
      'likeableType',
      [sequelize.fn('COUNT', sequelize.col('reactionType')), 'count']
    ],
    group: ['reactionType', 'likeableType'],
    raw: true
  });
};

module.exports = Like; 