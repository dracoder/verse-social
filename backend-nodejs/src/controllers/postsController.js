const { Post, Comment, Like, User, Profile } = require('../models');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Get all posts (public feed)
const getPosts = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  const user = req.user;

  // Build query options
  const queryOptions = {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name'],
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: ['displayName', 'avatar']
          }
        ]
      }
    ],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  let posts;
  if (user) {
    // For authenticated users, show posts they can view
    posts = await Post.findAll({
      ...queryOptions,
      where: {
        isPublished: true,
        scheduledFor: {
          [require('sequelize').Op.or]: [
            null,
            { [require('sequelize').Op.lte]: new Date() }
          ]
        }
      }
    });
    
    // Filter posts based on privacy and user permissions
    posts = posts.filter(post => post.canBeViewedBy(user));
  } else {
    // For unauthenticated users, only show public posts
    posts = await Post.getPublicPosts(parseInt(limit), parseInt(offset));
    
    // Add author information
    for (let post of posts) {
      post.author = await User.findByPk(post.userId, {
        attributes: ['id', 'name'],
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: ['displayName', 'avatar']
          }
        ]
      });
    }
  }

  // Get engagement data for each post if user is authenticated
  if (user) {
    for (let post of posts) {
      // Check if user has liked this post
      const userLike = await Like.getUserLikesForItem(user.id, post.id, 'post');
      post.dataValues.userReaction = userLike ? userLike.reactionType : null;
      
      // Get reactions summary
      const reactionsSummary = await Like.getLikesSummaryForItem(post.id, 'post');
      post.dataValues.reactions = reactionsSummary;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      posts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: posts.length
      }
    }
  });
});

// Get single post
const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const post = await Post.findByPk(id, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name'],
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: ['displayName', 'avatar']
          }
        ]
      }
    ]
  });

  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  // Check if user can view this post
  if (!post.canBeViewedBy(user)) {
    throw new ApiError(403, 'You do not have permission to view this post');
  }

  // Increment view count (only for non-author views)
  if (!user || user.id !== post.userId) {
    await post.incrementViewCount();
  }

  // Get user's reaction if authenticated
  if (user) {
    const userLike = await Like.getUserLikesForItem(user.id, post.id, 'post');
    post.dataValues.userReaction = userLike ? userLike.reactionType : null;
  }

  // Get reactions summary
  const reactionsSummary = await Like.getLikesSummaryForItem(post.id, 'post');
  post.dataValues.reactions = reactionsSummary;

  res.status(200).json({
    success: true,
    data: { post }
  });
});

// Create new post
const createPost = asyncHandler(async (req, res) => {
  const user = req.user;
  const {
    content,
    groupId = null,
    privacyLevel = 'public',
    location = null,
    feeling = null,
    tags = [],
    scheduledFor = null,
    commentsEnabled = true,
    likesEnabled = true,
    sharingEnabled = true
  } = req.body;

  // Validate that either content or media is provided
  const hasMedia = req.files && req.files.length > 0;
  if (!content && !hasMedia) {
    throw new ApiError(400, 'Post must have either content or media');
  }

  // Create the post
  const postData = {
    userId: user.id,
    content: content || null,
    groupId,
    privacyLevel,
    location,
    feeling,
    tags,
    scheduledFor,
    commentsEnabled,
    likesEnabled,
    sharingEnabled,
    isPublished: !scheduledFor || new Date(scheduledFor) <= new Date()
  };

  const post = await Post.create(postData);

  // Handle media uploads if present
  if (hasMedia) {
    for (const file of req.files) {
      // In a real implementation, you would upload to cloud storage here
      // For now, we'll simulate the media object
      await post.addMedia({
        type: file.mimetype.startsWith('image/') ? 'image' : 
              file.mimetype.startsWith('video/') ? 'video' : 'document',
        url: `/uploads/${file.filename}`, // This would be the cloud URL
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      });
    }
  }

  // Load the complete post with author information
  const completePost = await Post.findByPk(post.id, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name'],
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: ['displayName', 'avatar']
          }
        ]
      }
    ]
  });

  logger.info(`Post created by user ${user.id}: ${post.id}`);

  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: { post: completePost }
  });
});

// Update post
const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const post = await Post.findByPk(id);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  // Check permissions
  if (!post.canBeEditedBy(user)) {
    throw new ApiError(403, 'You do not have permission to edit this post');
  }

  // Update post fields
  const updateFields = [
    'content', 'privacyLevel', 'location', 'feeling', 'tags',
    'isPinned', 'commentsEnabled', 'likesEnabled', 'sharingEnabled'
  ];

  updateFields.forEach(field => {
    if (req.body.hasOwnProperty(field)) {
      post[field] = req.body[field];
    }
  });

  await post.save();

  // Load the complete post with author information
  const completePost = await Post.findByPk(post.id, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'name'],
        include: [
          {
            model: Profile,
            as: 'profile',
            attributes: ['displayName', 'avatar']
          }
        ]
      }
    ]
  });

  logger.info(`Post updated by user ${user.id}: ${post.id}`);

  res.status(200).json({
    success: true,
    message: 'Post updated successfully',
    data: { post: completePost }
  });
});

// Delete post
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const post = await Post.findByPk(id);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  // Check permissions
  if (!post.canBeDeletedBy(user)) {
    throw new ApiError(403, 'You do not have permission to delete this post');
  }

  await post.destroy();

  logger.info(`Post deleted by user ${user.id}: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully'
  });
});

// Like/Unlike post
const likePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const { reactionType = 'like' } = req.body;

  const post = await Post.findByPk(id);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  // Check if user can view this post (required to like it)
  if (!post.canBeViewedBy(user)) {
    throw new ApiError(403, 'You do not have permission to interact with this post');
  }

  // Check if likes are enabled for this post
  if (!post.likesEnabled) {
    throw new ApiError(403, 'Likes are disabled for this post');
  }

  const { like, action } = await Like.likeItem(user.id, post.id, 'post', reactionType);

  // Get updated reactions summary
  const reactionsSummary = await Like.getLikesSummaryForItem(post.id, 'post');

  res.status(200).json({
    success: true,
    message: `Post ${action}`,
    data: {
      action,
      userReaction: like && like.isActive ? like.reactionType : null,
      reactions: reactionsSummary
    }
  });
});

// Get post comments
const getPostComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const user = req.user;

  const post = await Post.findByPk(id);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  // Check if user can view this post
  if (!post.canBeViewedBy(user)) {
    throw new ApiError(403, 'You do not have permission to view this post');
  }

  const comments = await Comment.getCommentsByPost(id, parseInt(limit), parseInt(offset));

  // Add author information and user reactions
  for (let comment of comments) {
    comment.author = await User.findByPk(comment.userId, {
      attributes: ['id', 'name'],
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['displayName', 'avatar']
        }
      ]
    });

    if (user) {
      const userLike = await Like.getUserLikesForItem(user.id, comment.id, 'comment');
      comment.dataValues.userReaction = userLike ? userLike.reactionType : null;
    }

    const reactionsSummary = await Like.getLikesSummaryForItem(comment.id, 'comment');
    comment.dataValues.reactions = reactionsSummary;
  }

  res.status(200).json({
    success: true,
    data: {
      comments,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: comments.length
      }
    }
  });
});

// Get user's posts
const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 20, offset = 0 } = req.query;
  const viewer = req.user;

  const posts = await Post.getPostsByUser(userId, viewer?.id, parseInt(limit), parseInt(offset));

  // Add author information
  for (let post of posts) {
    post.author = await User.findByPk(post.userId, {
      attributes: ['id', 'name'],
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['displayName', 'avatar']
        }
      ]
    });

    if (viewer) {
      const userLike = await Like.getUserLikesForItem(viewer.id, post.id, 'post');
      post.dataValues.userReaction = userLike ? userLike.reactionType : null;
    }

    const reactionsSummary = await Like.getLikesSummaryForItem(post.id, 'post');
    post.dataValues.reactions = reactionsSummary;
  }

  res.status(200).json({
    success: true,
    data: {
      posts,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: posts.length
      }
    }
  });
});

// Search posts
const searchPosts = asyncHandler(async (req, res) => {
  const { query, limit = 20, offset = 0 } = req.query;

  if (!query) {
    throw new ApiError(400, 'Search query is required');
  }

  const posts = await Post.searchPosts(query, parseInt(limit), parseInt(offset));

  // Add author information
  for (let post of posts) {
    post.author = await User.findByPk(post.userId, {
      attributes: ['id', 'name'],
      include: [
        {
          model: Profile,
          as: 'profile',
          attributes: ['displayName', 'avatar']
        }
      ]
    });

    const reactionsSummary = await Like.getLikesSummaryForItem(post.id, 'post');
    post.dataValues.reactions = reactionsSummary;
  }

  res.status(200).json({
    success: true,
    data: {
      posts,
      query,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: posts.length
      }
    }
  });
});

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  getPostComments,
  getUserPosts,
  searchPosts
}; 