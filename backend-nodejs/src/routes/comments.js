const express = require('express');
const router = express.Router();

const commentsController = require('../controllers/commentsController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { 
  validate, 
  commentCreateSchema,
  commentUpdateSchema,
  likeSchema
} = require('../utils/validation');

// Public routes (optional auth for engagement data)
router.get('/search', optionalAuth, commentsController.searchComments);
router.get('/user/:userId', optionalAuth, commentsController.getUserComments);
router.get('/:id', optionalAuth, commentsController.getComment);
router.get('/:id/replies', optionalAuth, commentsController.getCommentReplies);
router.get('/:id/thread', optionalAuth, commentsController.getCommentThread);

// Protected routes (require authentication)
router.post('/post/:postId', requireAuth, validate(commentCreateSchema), commentsController.createComment);
router.put('/:id', requireAuth, validate(commentUpdateSchema), commentsController.updateComment);
router.delete('/:id', requireAuth, commentsController.deleteComment);
router.post('/:id/like', requireAuth, validate(likeSchema), commentsController.likeComment);
router.patch('/:id/pin', requireAuth, commentsController.pinComment);
router.patch('/:id/highlight', requireAuth, commentsController.highlightComment);

module.exports = router; 