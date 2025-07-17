const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Profile = require('./Profile');
const Post = require('./Post');
const Comment = require('./Comment');
const Like = require('./Like');
const Group = require('./Group');
const GroupMember = require('./GroupMember');


User.hasOne(Profile, {
  foreignKey: 'userId',
  as: 'profile',
  onDelete: 'CASCADE'
});

User.hasMany(Post, {
  foreignKey: 'userId',
  as: 'posts',
  onDelete: 'CASCADE'
});

User.hasMany(Comment, {
  foreignKey: 'userId',
  as: 'comments',
  onDelete: 'CASCADE'
});

User.hasMany(Like, {
  foreignKey: 'userId',
  as: 'likes',
  onDelete: 'CASCADE'
});

User.hasMany(Group, {
  foreignKey: 'createdBy',
  as: 'createdGroups',
  onDelete: 'CASCADE'
});

User.belongsToMany(Group, {
  through: GroupMember,
  foreignKey: 'userId',
  otherKey: 'groupId',
  as: 'groups'
});

User.hasMany(GroupMember, {
  foreignKey: 'userId',
  as: 'groupMemberships',
  onDelete: 'CASCADE'
});

Profile.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});
Post.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author'
});

Post.hasMany(Comment, {
  foreignKey: 'postId',
  as: 'comments',
  onDelete: 'CASCADE'
});

Post.belongsTo(Group, {
  foreignKey: 'groupId',
  as: 'group'
});

// Comment associations
Comment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'author'
});

Comment.belongsTo(Post, {
  foreignKey: 'postId',
  as: 'post'
});

Comment.belongsTo(Comment, {
  foreignKey: 'parentId',
  as: 'parent'
});

Comment.hasMany(Comment, {
  foreignKey: 'parentId',
  as: 'replies',
  onDelete: 'CASCADE'
});

// Like associations
Like.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Group associations
Group.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

Group.belongsToMany(User, {
  through: GroupMember,
  foreignKey: 'groupId',
  otherKey: 'userId',
  as: 'members'
});

Group.hasMany(Post, {
  foreignKey: 'groupId',
  as: 'posts',
  onDelete: 'CASCADE'
});

Group.hasMany(GroupMember, {
  foreignKey: 'groupId',
  as: 'memberships',
  onDelete: 'CASCADE'
});

// GroupMember associations
GroupMember.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

GroupMember.belongsTo(Group, {
  foreignKey: 'groupId',
  as: 'group'
});

GroupMember.belongsTo(User, {
  foreignKey: 'addedBy',
  as: 'inviter'
});

GroupMember.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'roleUpdater'
});

// Export all models and sequelize
module.exports = {
  sequelize,
  User,
  Profile,
  Post,
  Comment,
  Like,
  Group,
  GroupMember
};

// Sync database (only in development and when database is available)
if (process.env.NODE_ENV === 'development') {
  sequelize.sync({ alter: true }).then(() => {
    console.log('✅ Database synced successfully');
  }).catch(err => {
    console.error('❌ Database sync failed:', err);
  });
} 