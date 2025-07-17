const { Group, GroupMember, User, Profile, Post } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const { groupValidation } = require('../utils/validation');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const createGroup = asyncHandler(async (req, res) => {
  const { error } = groupValidation.create.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const { name, description, shortDescription, privacy, joinApproval, category, tags, rules } = req.body;
  
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  const existingGroup = await Group.findOne({ where: { slug } });
  if (existingGroup) {
    throw new ApiError(400, 'A group with this name already exists');
  }

  const group = await Group.create({
    name,
    slug,
    description,
    shortDescription,
    privacy,
    joinApproval,
    category,
    tags: tags || [],
    rules: rules || [],
    createdBy: req.user.id,
    lastActivityAt: new Date()
  });

  await group.addMember(req.user.id, 'admin');

  const groupWithCreator = await Group.findByPk(group.id, {
    include: [
      {
        model: User,
        as: 'creator',
        include: [{ model: Profile, as: 'profile' }]
      }
    ]
  });

  logger.info(`Group created: ${group.name}`, {
    groupId: group.id,
    createdBy: req.user.id,
    privacy: group.privacy
  });

  res.status(201).json({
    success: true,
    message: 'Group created successfully',
    data: groupWithCreator
  });
});

const getGroups = asyncHandler(async (req, res) => {
  const { error } = groupValidation.search.validate(req.query);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const { 
    page = 1, 
    limit = 20, 
    category, 
    privacy = 'public',
    featured,
    sortBy = 'recent',
    search
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { isActive: true };

  if (category) {
    whereClause.category = category;
  }

  if (privacy) {
    whereClause.privacy = privacy;
  }

  if (featured !== undefined) {
    whereClause.isFeatured = featured === 'true';
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { shortDescription: { [Op.iLike]: `%${search}%` } }
    ];
  }

  let order = [];
  switch (sortBy) {
    case 'name':
      order = [['name', 'ASC']];
      break;
    case 'members':
      order = [[{ model: GroupMember, as: 'memberships' }, 'id', 'DESC']];
      break;
    case 'activity':
      order = [['lastActivityAt', 'DESC']];
      break;
    default:
      order = [['createdAt', 'DESC']];
  }

  const { count, rows: groups } = await Group.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'creator',
        include: [{ model: Profile, as: 'profile' }]
      }
    ],
    order,
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true
  });

  const groupsWithStats = await Promise.all(
    groups.map(async (group) => {
      const stats = await group.getStats();
      return {
        ...group.toJSON(),
        stats
      };
    })
  );

  res.json({
    success: true,
    data: {
      groups: groupsWithStats,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

const getGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const group = await Group.findByPk(id, {
    include: [
      {
        model: User,
        as: 'creator',
        include: [{ model: Profile, as: 'profile' }]
      }
    ]
  });

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const canAccess = await group.canUserAccess(req.user?.id);
  if (!canAccess) {
    throw new ApiError(403, 'You do not have permission to view this group');
  }

  const stats = await group.getStats();
  const userMembership = req.user ? await group.getMemberRole(req.user.id) : null;

  res.json({
    success: true,
    data: {
      ...group.toJSON(),
      stats,
      userMembership
    }
  });
});

const updateGroup = asyncHandler(async (req, res) => {
  const { error } = groupValidation.update.validate(req.body);
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  const { id } = req.params;
  const group = await Group.findByPk(id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const canEdit = await group.canUserModerate(req.user.id);
  if (!canEdit) {
    throw new ApiError(403, 'You do not have permission to edit this group');
  }

  const updateData = { ...req.body };
  
  if (updateData.name && updateData.name !== group.name) {
    const slug = updateData.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    const existingGroup = await Group.findOne({ 
      where: { 
        slug,
        id: { [Op.ne]: group.id }
      }
    });
    
    if (existingGroup) {
      throw new ApiError(400, 'A group with this name already exists');
    }
    
    updateData.slug = slug;
  }

  await group.update(updateData);

  logger.info(`Group updated: ${group.name}`, {
    groupId: group.id,
    updatedBy: req.user.id,
    updatedFields: Object.keys(updateData)
  });

  res.json({
    success: true,
    message: 'Group updated successfully',
    data: group
  });
});

const deleteGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const group = await Group.findByPk(id);

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const memberRole = await group.getMemberRole(req.user.id);
  if (memberRole !== 'admin') {
    throw new ApiError(403, 'Only group admins can delete groups');
  }

  await group.destroy();

  logger.info(`Group deleted: ${group.name}`, {
    groupId: group.id,
    deletedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Group deleted successfully'
  });
});

const joinGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  
  const group = await Group.findByPk(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  if (group.privacy === 'hidden') {
    throw new ApiError(403, 'This group is not joinable');
  }

  const existingMembership = await GroupMember.findOne({
    where: {
      groupId: group.id,
      userId: req.user.id
    }
  });

  if (existingMembership) {
    if (existingMembership.status === 'active') {
      throw new ApiError(400, 'You are already a member of this group');
    }
    if (existingMembership.status === 'pending') {
      throw new ApiError(400, 'Your membership request is pending approval');
    }
    if (existingMembership.status === 'banned') {
      throw new ApiError(403, 'You are banned from this group');
    }
  }

  const status = group.joinApproval === 'automatic' ? 'active' : 'pending';
  
  await GroupMember.create({
    groupId: group.id,
    userId: req.user.id,
    status,
    inviteMessage: message,
    joinedAt: status === 'active' ? new Date() : null
  });

  logger.info(`User ${status === 'active' ? 'joined' : 'requested to join'} group: ${group.name}`, {
    groupId: group.id,
    userId: req.user.id,
    status
  });

  res.json({
    success: true,
    message: status === 'active' 
      ? 'Successfully joined the group' 
      : 'Membership request sent for approval',
    data: { status }
  });
});

const leaveGroup = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const group = await Group.findByPk(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const membership = await GroupMember.findOne({
    where: {
      groupId: group.id,
      userId: req.user.id,
      status: 'active'
    }
  });

  if (!membership) {
    throw new ApiError(400, 'You are not a member of this group');
  }

  if (membership.role === 'admin') {
    const adminCount = await GroupMember.count({
      where: {
        groupId: group.id,
        role: 'admin',
        status: 'active'
      }
    });

    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot leave group as the only admin. Transfer admin role first.');
    }
  }

  await membership.update({
    status: 'left',
    leftAt: new Date()
  });

  logger.info(`User left group: ${group.name}`, {
    groupId: group.id,
    userId: req.user.id
  });

  res.json({
    success: true,
    message: 'Successfully left the group'
  });
});

const getMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, role, search } = req.query;
  const offset = (page - 1) * limit;
  
  const group = await Group.findByPk(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const canAccess = await group.canUserAccess(req.user?.id);
  if (!canAccess) {
    throw new ApiError(403, 'You do not have permission to view group members');
  }

  const whereClause = {
    groupId: group.id,
    status: 'active'
  };

  if (role) {
    whereClause.role = role;
  }

  const includeClause = [
    {
      model: User,
      as: 'user',
      include: [{ model: Profile, as: 'profile' }]
    }
  ];

  if (search) {
    includeClause[0].where = {
      [Op.or]: [
        { email: { [Op.iLike]: `%${search}%` } },
        { '$user.profile.displayName$': { [Op.iLike]: `%${search}%` } },
        { '$user.profile.username$': { [Op.iLike]: `%${search}%` } }
      ]
    };
  }

  const { count, rows: members } = await GroupMember.findAndCountAll({
    where: whereClause,
    include: includeClause,
    order: [
      ['role', 'DESC'],
      ['joinedAt', 'ASC']
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true
  });

  res.json({
    success: true,
    data: {
      members,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const { role } = req.body;

  if (!['member', 'moderator', 'admin'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const group = await Group.findByPk(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const requesterRole = await group.getMemberRole(req.user.id);
  if (requesterRole !== 'admin') {
    throw new ApiError(403, 'Only admins can update member roles');
  }

  const membership = await GroupMember.findOne({
    where: {
      groupId: group.id,
      userId,
      status: 'active'
    }
  });

  if (!membership) {
    throw new ApiError(404, 'User is not a member of this group');
  }

  if (membership.role === 'admin' && role !== 'admin') {
    const adminCount = await GroupMember.count({
      where: {
        groupId: group.id,
        role: 'admin',
        status: 'active'
      }
    });

    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot remove the only admin. Promote another member first.');
    }
  }

  await membership.update({
    role,
    updatedBy: req.user.id
  });

  logger.info(`Member role updated in group: ${group.name}`, {
    groupId: group.id,
    targetUserId: userId,
    newRole: role,
    updatedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Member role updated successfully'
  });
});

const removeMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const { reason } = req.body;
  
  const group = await Group.findByPk(id);
  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  const requesterRole = await group.getMemberRole(req.user.id);
  if (!['admin', 'moderator'].includes(requesterRole)) {
    throw new ApiError(403, 'You do not have permission to remove members');
  }

  const membership = await GroupMember.findOne({
    where: {
      groupId: group.id,
      userId,
      status: 'active'
    }
  });

  if (!membership) {
    throw new ApiError(404, 'User is not a member of this group');
  }

  if (membership.role === 'admin' && requesterRole !== 'admin') {
    throw new ApiError(403, 'Cannot remove an admin unless you are an admin');
  }

  if (membership.role === 'admin') {
    const adminCount = await GroupMember.count({
      where: {
        groupId: group.id,
        role: 'admin',
        status: 'active'
      }
    });

    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot remove the only admin');
    }
  }

  await membership.update({
    status: 'banned',
    leftAt: new Date(),
    banReason: reason,
    updatedBy: req.user.id
  });

  logger.info(`Member removed from group: ${group.name}`, {
    groupId: group.id,
    removedUserId: userId,
    reason,
    removedBy: req.user.id
  });

  res.json({
    success: true,
    message: 'Member removed successfully'
  });
});

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getMembers,
  updateMemberRole,
  removeMember
}; 