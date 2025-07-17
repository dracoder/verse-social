const { Comment, Post, Like, User, Profile } = require('../models');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const user = req.user;
  const { content, parentId = null, mentionedUsers = [] } = req.body;

  // Verify post exists and user can view it
  const post = await Post.findByPk(postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (!post.canBeViewedBy(user)) {
    throw new ApiError(403, 'You do not have permission to comment on this post');
  }


  if (!post.commentsEnabled) {
    throw new ApiError(403, 'Comments are disabled for this post');
  }


  if (parentId) {
    const parentComment = await Comment.findByPk(parentId);
    if (!parentComment || parentComment.postId !== postId) {
      throw new ApiError(400, 'Invalid parent comment');
    }
    
    // Check maximum nesting depth
    if (parentComment.depth >= 5) {
      throw new ApiError(400, 'Maximum comment nesting depth reached');
    }
  }

  const comment = await Comment.create({
    userId: user.id,
    postId,
    parentId,
    content,
    mentionedUsers
  });

  await post.incrementCommentsCount();
  const completeComment = await Comment.findByPk(comment.id, {
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

  logger.info(`Comment created by user ${user.id} on post ${postId}: ${comment.id}`);

  res.status(201).json({
    success: true,
    message: 'Comment created successfully',
    data: { comment: completeComment }
  });
});

const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const { content, mentionedUsers } = req.body;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check permissions
  if (!comment.canBeEditedBy(user)) {
    throw new ApiError(403, 'You do not have permission to edit this comment');
  }

  // Update comment
  comment.content = content;
  if (mentionedUsers !== undefined) {
    comment.mentionedUsers = mentionedUsers;
  }

  await comment.save();

  // Load the complete comment with author information
  const completeComment = await Comment.findByPk(comment.id, {
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

  logger.info(`Comment updated by user ${user.id}: ${comment.id}`);

  res.status(200).json({
    success: true,
    message: 'Comment updated successfully',
    data: { comment: completeComment }
  });
});

// Delete comment
const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check permissions
  if (!comment.canBeDeletedBy(user)) {
    throw new ApiError(403, 'You do not have permission to delete this comment');
  }

  await comment.destroy();

  logger.info(`Comment deleted by user ${user.id}: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

// Get single comment with its thread
const getComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const comment = await Comment.findByPk(id, {
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
      },
      {
        model: Post,
        as: 'post',
        attributes: ['id', 'userId', 'privacyLevel']
      }
    ]
  });

  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check if user can view the post that contains this comment
  const post = await Post.findByPk(comment.postId);
  if (!post || !post.canBeViewedBy(user)) {
    throw new ApiError(403, 'You do not have permission to view this comment');
  }

  // Get user's reaction if authenticated
  if (user) {
    const userLike = await Like.getUserLikesForItem(user.id, comment.id, 'comment');
    comment.dataValues.userReaction = userLike ? userLike.reactionType : null;
  }

  // Get reactions summary
  const reactionsSummary = await Like.getLikesSummaryForItem(comment.id, 'comment');
  comment.dataValues.reactions = reactionsSummary;

  res.status(200).json({
    success: true,
    data: { comment }
  });
});

// Get comment replies
const getCommentReplies = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 10, offset = 0 } = req.query;
  const user = req.user;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check if user can view the post that contains this comment
  const post = await Post.findByPk(comment.postId);
  if (!post || !post.canBeViewedBy(user)) {
    throw new ApiError(403, 'You do not have permission to view this comment');
  }

  const replies = await comment.getReplies(parseInt(limit), parseInt(offset));

  // Add author information and user reactions
  for (let reply of replies) {
    reply.author = await User.findByPk(reply.userId, {
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
      const userLike = await Like.getUserLikesForItem(user.id, reply.id, 'comment');
      reply.dataValues.userReaction = userLike ? userLike.reactionType : null;
    }

    const reactionsSummary = await Like.getLikesSummaryForItem(reply.id, 'comment');
    reply.dataValues.reactions = reactionsSummary;
  }

  res.status(200).json({
    success: true,
    data: {
      replies,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: replies.length
      }
    }
  });
});

// Get full comment thread
const getCommentThread = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check if user can view the post that contains this comment
  const post = await Post.findByPk(comment.postId);
  if (!post || !post.canBeViewedBy(user)) {
    throw new ApiError(403, 'You do not have permission to view this comment');
  }

  const thread = await comment.getThread();

  // Add author information and user reactions
  for (let threadComment of thread) {
    threadComment.author = await User.findByPk(threadComment.userId, {
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
      const userLike = await Like.getUserLikesForItem(user.id, threadComment.id, 'comment');
      threadComment.dataValues.userReaction = userLike ? userLike.reactionType : null;
    }

    const reactionsSummary = await Like.getLikesSummaryForItem(threadComment.id, 'comment');
    threadComment.dataValues.reactions = reactionsSummary;
  }

  res.status(200).json({
    success: true,
    data: { thread }
  });
});

// Like/Unlike comment
const likeComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const { reactionType = 'like' } = req.body;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check if user can view the post that contains this comment
  const post = await Post.findByPk(comment.postId);
  if (!post || !post.canBeViewedBy(user)) {
    throw new ApiError(403, 'You do not have permission to interact with this comment');
  }

  const { like, action } = await Like.likeItem(user.id, comment.id, 'comment', reactionType);

  // Get updated reactions summary
  const reactionsSummary = await Like.getLikesSummaryForItem(comment.id, 'comment');

  res.status(200).json({
    success: true,
    message: `Comment ${action}`,
    data: {
      action,
      userReaction: like && like.isActive ? like.reactionType : null,
      reactions: reactionsSummary
    }
  });
});

// Pin/Unpin comment (for post authors and moderators)
const pinComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const { isPinned } = req.body;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check if user can pin comments (post author or moderator)
  const post = await Post.findByPk(comment.postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (post.userId !== user.id) {
    // TODO: Add moderator permissions check
    throw new ApiError(403, 'You do not have permission to pin comments on this post');
  }

  comment.isPinned = isPinned;
  await comment.save();

  res.status(200).json({
    success: true,
    message: `Comment ${isPinned ? 'pinned' : 'unpinned'} successfully`,
    data: { comment }
  });
});

// Highlight comment (for special recognition)
const highlightComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const { isHighlighted } = req.body;

  const comment = await Comment.findByPk(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  // Check if user can highlight comments (post author or moderator)
  const post = await Post.findByPk(comment.postId);
  if (!post) {
    throw new ApiError(404, 'Post not found');
  }

  if (post.userId !== user.id) {
    // TODO: Add moderator permissions check
    throw new ApiError(403, 'You do not have permission to highlight comments on this post');
  }

  comment.isHighlighted = isHighlighted;
  await comment.save();

  res.status(200).json({
    success: true,
    message: `Comment ${isHighlighted ? 'highlighted' : 'unhighlighted'} successfully`,
    data: { comment }
  });
});

// Get user's comments
const getUserComments = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const comments = await Comment.getCommentsByUser(userId, parseInt(limit), parseInt(offset));

  // Add author information
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

// Search comments
const searchComments = asyncHandler(async (req, res) => {
  const { query, postId = null, limit = 20, offset = 0 } = req.query;

  if (!query) {
    throw new ApiError(400, 'Search query is required');
  }

  const comments = await Comment.searchComments(query, postId, parseInt(limit), parseInt(offset));

  // Add author information
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

    const reactionsSummary = await Like.getLikesSummaryForItem(comment.id, 'comment');
    comment.dataValues.reactions = reactionsSummary;
  }

  res.status(200).json({
    success: true,
    data: {
      comments,
      query,
      postId,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: comments.length
      }
    }
  });
});

module.exports = {
  createComment,
  updateComment,
  deleteComment,
  getComment,
  getCommentReplies,
  getCommentThread,
  likeComment,
  pinComment,
  highlightComment,
  getUserComments,
  searchComments
}; 