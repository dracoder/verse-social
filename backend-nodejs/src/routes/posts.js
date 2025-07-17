const express = require('express');
const router = express.Router();

const postsController = require('../controllers/postsController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { 
  validate, 
  postCreateSchema,
  postUpdateSchema,
  likeSchema,
  paginationSchema
} = require('../utils/validation');

// Public routes (optional auth for engagement data)
router.get('/', optionalAuth, postsController.getPosts);
router.get('/search', optionalAuth, postsController.searchPosts);
router.get('/:id', optionalAuth, postsController.getPost);
router.get('/:id/comments', optionalAuth, postsController.getPostComments);
router.get('/user/:userId', optionalAuth, postsController.getUserPosts);

// Protected routes (require authentication)
router.post('/', requireAuth, validate(postCreateSchema), postsController.createPost);
router.put('/:id', requireAuth, validate(postUpdateSchema), postsController.updatePost);
router.delete('/:id', requireAuth, postsController.deletePost);
router.post('/:id/like', requireAuth, validate(likeSchema), postsController.likePost);

module.exports = router; 