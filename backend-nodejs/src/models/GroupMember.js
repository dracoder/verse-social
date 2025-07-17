const { DataTypes, Model } = require('sequelize');

class GroupMember extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    this.belongsTo(models.Group, {
      foreignKey: 'groupId',
      as: 'group'
    });
    
    this.belongsTo(models.User, {
      foreignKey: 'addedBy',
      as: 'inviter'
    });
    
    this.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'roleUpdater'
    });
  }

  canModerate() {
    return ['admin', 'moderator'].includes(this.role);
  }

  canInviteMembers() {
    return ['admin', 'moderator'].includes(this.role);
  }

  canEditGroup() {
    return this.role === 'admin';
  }

  canRemoveMembers() {
    return ['admin', 'moderator'].includes(this.role);
  }

  canUpdateRoles() {
    return this.role === 'admin';
  }

  getPermissions() {
    const basePermissions = {
      canPost: true,
      canComment: true,
      canReact: true,
      canViewMembers: true
    };

    const rolePermissions = {
      member: basePermissions,
      moderator: {
        ...basePermissions,
        canModerate: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canPinPosts: true,
        canDeletePosts: true
      },
      admin: {
        ...basePermissions,
        canModerate: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canUpdateRoles: true,
        canEditGroup: true,
        canDeleteGroup: true,
        canPinPosts: true,
        canDeletePosts: true,
        canViewAnalytics: true
      }
    };

    return rolePermissions[this.role] || basePermissions;
  }
}

module.exports = (sequelize) => {
  GroupMember.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('member', 'moderator', 'admin'),
      defaultValue: 'member',
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'banned', 'left'),
      defaultValue: 'active',
      allowNull: false
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    addedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    inviteMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    banReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    banExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        source: 'direct',
        inviteAcceptedAt: null,
        lastActiveAt: null
      }
    }
  }, {
    sequelize,
    modelName: 'GroupMember',
    tableName: 'group_members',
    indexes: [
      {
        fields: ['groupId', 'userId'],
        unique: true
      },
      {
        fields: ['groupId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['role']
      },
      {
        fields: ['status']
      },
      {
        fields: ['joinedAt']
      },
      {
        fields: ['addedBy']
      }
    ]
  });

  return GroupMember;
}; 