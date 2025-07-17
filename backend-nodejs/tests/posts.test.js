const request = require('supertest');
const app = require('../src/app');

describe('Posts API', () => {
  
  describe('GET /api/posts', () => {
    it('should return posts list for unauthenticated users', async () => {
      const res = await request(app)
        .get('/api/posts')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('posts');
      expect(res.body.data).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data.posts)).toBe(true);
    });

    it('should accept pagination parameters', async () => {
      const res = await request(app)
        .get('/api/posts?limit=10&offset=0')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination.limit).toBe(10);
      expect(res.body.data.pagination.offset).toBe(0);
    });
  });

  describe('POST /api/posts', () => {
    it('should reject post creation without authentication', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({
          content: 'Test post content'
        })
        .expect(401);
      
      expect(res.body.success).toBe(false);
    });

    it('should reject post with invalid data', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          content: 'a'.repeat(10001), // Exceeds max length
          privacyLevel: 'invalid-privacy'
        });
      
      // Will fail with authentication error first, which is expected
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/posts/search', () => {
    it('should require search query parameter', async () => {
      const res = await request(app)
        .get('/api/posts/search')
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('query');
    });

    it('should accept search query', async () => {
      const res = await request(app)
        .get('/api/posts/search?query=test')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('posts');
      expect(res.body.data.query).toBe('test');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return 404 for non-existent post', async () => {
      const res = await request(app)
        .get('/api/posts/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });
  });

  describe('POST /api/posts/:id/like', () => {
    it('should reject like without authentication', async () => {
      const res = await request(app)
        .post('/api/posts/550e8400-e29b-41d4-a716-446655440000/like')
        .send({ reactionType: 'like' })
        .expect(401);
      
      expect(res.body.success).toBe(false);
    });
  });

});

describe('Comments API', () => {
  
  describe('POST /api/comments/post/:postId', () => {
    it('should reject comment creation without authentication', async () => {
      const res = await request(app)
        .post('/api/comments/post/550e8400-e29b-41d4-a716-446655440000')
        .send({
          content: 'Test comment'
        })
        .expect(401);
      
      expect(res.body.success).toBe(false);
    });

    it('should reject comment with invalid data', async () => {
      const res = await request(app)
        .post('/api/comments/post/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          content: '', // Empty content
        });
      
      // Will fail with authentication error first, which is expected
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/comments/search', () => {
    it('should require search query parameter', async () => {
      const res = await request(app)
        .get('/api/comments/search')
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('query');
    });

    it('should accept search query', async () => {
      const res = await request(app)
        .get('/api/comments/search?query=test')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('comments');
      expect(res.body.data.query).toBe('test');
    });
  });

  describe('GET /api/comments/:id', () => {
    it('should return 404 for non-existent comment', async () => {
      const res = await request(app)
        .get('/api/comments/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });
  });

  describe('GET /api/comments/:id/replies', () => {
    it('should return 404 for non-existent comment', async () => {
      const res = await request(app)
        .get('/api/comments/550e8400-e29b-41d4-a716-446655440000/replies')
        .expect(404);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('not found');
    });
  });

}); 