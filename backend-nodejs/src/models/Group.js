const { DataTypes, Model } = require('sequelize');

class Group extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    
    this.belongsToMany(models.User, {
      through: 'GroupMembers',
      foreignKey: 'groupId',
      otherKey: 'userId',
      as: 'members'
    });
    
    this.hasMany(models.Post, {
      foreignKey: 'groupId',
      as: 'posts'
    });
    
    this.hasMany(models.GroupMember, {
      foreignKey: 'groupId',
      as: 'memberships'
    });
  }

  async addMember(userId, role = 'member', addedBy = null) {
    const { GroupMember } = require('./index');
    return await GroupMember.create({
      groupId: this.id,
      userId,
      role,
      addedBy,
      joinedAt: new Date()
    });
  }

  async removeMember(userId) {
    const { GroupMember } = require('./index');
    return await GroupMember.destroy({
      where: {
        groupId: this.id,
        userId
      }
    });
  }

  async updateMemberRole(userId, newRole, updatedBy = null) {
    const { GroupMember } = require('./index');
    return await GroupMember.update(
      { 
        role: newRole,
        updatedBy,
        updatedAt: new Date()
      },
      {
        where: {
          groupId: this.id,
          userId
        }
      }
    );
  }

  async getMemberRole(userId) {
    const { GroupMember } = require('./index');
    const membership = await GroupMember.findOne({
      where: {
        groupId: this.id,
        userId
      }
    });
    return membership ? membership.role : null;
  }

  async canUserAccess(userId) {
    if (this.privacy === 'public') return true;
    if (!userId) return false;
    
    const memberRole = await this.getMemberRole(userId);
    return memberRole !== null;
  }

  async canUserPost(userId) {
    if (!userId) return false;
    
    const memberRole = await this.getMemberRole(userId);
    if (!memberRole) return false;
    
    if (this.settings?.postingPermissions === 'admins_only') {
      return ['admin', 'moderator'].includes(memberRole);
    }
    
    return true;
  }

  async canUserModerate(userId) {
    if (!userId) return false;
    
    const memberRole = await this.getMemberRole(userId);
    return ['admin', 'moderator'].includes(memberRole);
  }

  async getStats() {
    const { GroupMember, Post } = require('./index');
    
    const [memberCount, postCount] = await Promise.all([
      GroupMember.count({
        where: { groupId: this.id }
      }),
      Post.count({
        where: { 
          groupId: this.id,
          isPublished: true 
        }
      })
    ]);

    return {
      memberCount,
      postCount,
      createdAt: this.createdAt,
      lastActivity: this.lastActivityAt
    };
  }

  toJSON() {
    const values = Object.assign({}, this.get());
    
    // Remove sensitive information
    if (values.settings && values.settings.moderationLogs) {
      delete values.settings.moderationLogs;
    }
    
    return values;
  }
}

module.exports = (sequelize) => {
  Group.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    shortDescription: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    avatarUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    coverPhotoUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    privacy: {
      type: DataTypes.ENUM('public', 'private', 'hidden'),
      defaultValue: 'public',
      allowNull: false
    },
    joinApproval: {
      type: DataTypes.ENUM('automatic', 'manual', 'invite_only'),
      defaultValue: 'automatic',
      allowNull: false
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    rules: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    settings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        postingPermissions: 'all_members',
        allowDiscussions: true,
        allowPolls: true,
        allowEvents: true,
        moderationMode: 'reactive',
        autoModeration: false
      }
    },
    stats: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        memberCount: 0,
        postCount: 0,
        weeklyActivity: 0,
        monthlyGrowth: 0
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Group',
    tableName: 'groups',
    indexes: [
      {
        fields: ['slug'],
        unique: true
      },
      {
        fields: ['privacy']
      },
      {
        fields: ['category']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['isFeatured']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['lastActivityAt']
      },
      {
        using: 'gin',
        fields: ['tags']
      }
    ]
  });

  return Group;
}; 