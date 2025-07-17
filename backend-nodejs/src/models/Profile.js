const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  theme: {
    type: DataTypes.STRING,
    defaultValue: 'default'
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true,
      len: [0, 255]
    }
  },
  backgroundImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  socialLinks: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  privacySettings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {
      profileVisibility: 'public',
      showEmail: false,
      showLocation: true,
      showOnlineStatus: true,
      allowMessagesFrom: 'everyone'
    }
  },
  profileDecorations: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  customColors: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  animatedBackground: {
    type: DataTypes.STRING,
    allowNull: true
  },
  widgetsLayout: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  mood: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'neutral'
  },
  fontStyle: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'default'
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastSeenAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'profiles',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['displayName']
    }
  ]
});

// Instance methods
Profile.prototype.updateOnlineStatus = function(isOnline) {
  this.isOnline = isOnline;
  if (!isOnline) {
    this.lastSeenAt = new Date();
  }
  return this.save();
};

Profile.prototype.addDecoration = function(decoration) {
  const decorations = this.profileDecorations || [];
  decorations.push({
    id: decoration.id,
    type: decoration.type,
    position: decoration.position,
    properties: decoration.properties,
    addedAt: new Date()
  });
  this.profileDecorations = decorations;
  return this.save();
};

Profile.prototype.removeDecoration = function(decorationId) {
  if (this.profileDecorations) {
    this.profileDecorations = this.profileDecorations.filter(
      decoration => decoration.id !== decorationId
    );
    return this.save();
  }
  return Promise.resolve(this);
};

// Class methods
Profile.findByUserId = function(userId) {
  return this.findOne({ where: { userId } });
};

Profile.findByDisplayName = function(displayName) {
  return this.findOne({ where: { displayName } });
};

Profile.getPublicProfiles = function(limit = 10, offset = 0) {
  return this.findAll({
    where: {
      'privacySettings.profileVisibility': 'public'
    },
    limit,
    offset,
    order: [['updatedAt', 'DESC']]
  });
};

module.exports = Profile; 