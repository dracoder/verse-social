const request = require('supertest');
const app = require('../src/app');
const { User, Profile } = require('../src/models');
const jwt = require('jsonwebtoken');

describe('Profile Endpoints', () => {
  let testUser, testProfile, authToken, otherUser, otherProfile;

  beforeAll(async () => {
    // Create test users
    testUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      password: 'hashedpassword'
    };

    otherUser = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'other@example.com',
      password: 'hashedpassword'
    };

    // Create test profiles
    testProfile = {
      id: '123e4567-e89b-12d3-a456-426614174100',
      userId: testUser.id,
      displayName: 'Test User',
      username: 'testuser',
      bio: 'Test bio',
      tagline: 'Test tagline',
      avatarUrl: 'https://example.com/avatar.jpg',
      coverPhotoUrl: 'https://example.com/cover.jpg',
      personalInfo: {
        birthday: '1990-01-01',
        gender: 'male',
        location: {
          city: 'Test City',
          country: 'Test Country'
        }
      },
      privacySettings: {
        profileVisibility: 'public',
        searchable: true
      }
    };

    otherProfile = {
      id: '123e4567-e89b-12d3-a456-426614174101',
      userId: otherUser.id,
      displayName: 'Other User',
      username: 'otheruser',
      bio: 'Other bio',
      privacySettings: {
        profileVisibility: 'private',
        searchable: false
      }
    };

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'testsecret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/profiles/search', () => {
    test('should search profiles successfully', async () => {
      const response = await request(app)
        .get('/api/profiles/search')
        .query({ q: 'test', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('profiles');
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should filter by city', async () => {
      const response = await request(app)
        .get('/api/profiles/search')
        .query({ city: 'Test City' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should validate search parameters', async () => {
      const response = await request(app)
        .get('/api/profiles/search')
        .query({ limit: 101 }); // Exceeds max limit

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/profiles/:id', () => {
    test('should get public profile successfully', async () => {
      const response = await request(app)
        .get(`/api/profiles/${testProfile.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('displayName');
    });

    test('should return 404 for non-existent profile', async () => {
      const response = await request(app)
        .get('/api/profiles/123e4567-e89b-12d3-a456-426614174999');

      expect(response.status).toBe(404);
    });

    test('should return 403 for private profile without permission', async () => {
      const response = await request(app)
        .get(`/api/profiles/${otherProfile.id}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/profiles/:id/stats', () => {
    test('should get profile stats for public profile', async () => {
      const response = await request(app)
        .get(`/api/profiles/${testProfile.id}/stats`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('postsCount');
      expect(response.body.data).toHaveProperty('followersCount');
    });

    test('should return 404 for non-existent profile stats', async () => {
      const response = await request(app)
        .get('/api/profiles/123e4567-e89b-12d3-a456-426614174999/stats');

      expect(response.status).toBe(404);
    });
  });

  describe('Protected Profile Routes', () => {
    describe('GET /api/profiles/me/profile', () => {
      test('should get own profile successfully', async () => {
        const response = await request(app)
          .get('/api/profiles/me/profile')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('displayName');
      });

      test('should return 401 without authentication', async () => {
        const response = await request(app)
          .get('/api/profiles/me/profile');

        expect(response.status).toBe(401);
      });

      test('should return 404 if profile not found', async () => {
        const noProfileToken = jwt.sign(
          { id: '123e4567-e89b-12d3-a456-426614174999', email: 'noprofile@example.com' },
          process.env.JWT_SECRET || 'testsecret',
          { expiresIn: '1h' }
        );

        const response = await request(app)
          .get('/api/profiles/me/profile')
          .set('Authorization', `Bearer ${noProfileToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/profiles/me/profile', () => {
      test('should update profile successfully', async () => {
        const updateData = {
          displayName: 'Updated Name',
          bio: 'Updated bio',
          personalInfo: {
            location: {
              city: 'New City'
            }
          }
        };

        const response = await request(app)
          .put('/api/profiles/me/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Profile updated successfully');
      });

      test('should validate update data', async () => {
        const invalidData = {
          displayName: '', // Too short
          username: 'ab' // Too short
        };

        const response = await request(app)
          .put('/api/profiles/me/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        expect(response.status).toBe(400);
      });

      test('should return 401 without authentication', async () => {
        const response = await request(app)
          .put('/api/profiles/me/profile')
          .send({ displayName: 'Test' });

        expect(response.status).toBe(401);
      });
    });

    describe('PUT /api/profiles/me/avatar', () => {
      test('should update avatar successfully', async () => {
        const avatarData = {
          avatarUrl: 'https://example.com/new-avatar.jpg'
        };

        const response = await request(app)
          .put('/api/profiles/me/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .send(avatarData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Avatar updated successfully');
      });

      test('should require avatar URL', async () => {
        const response = await request(app)
          .put('/api/profiles/me/avatar')
          .set('Authorization', `Bearer ${authToken}`)
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('PUT /api/profiles/me/cover-photo', () => {
      test('should update cover photo successfully', async () => {
        const coverData = {
          coverPhotoUrl: 'https://example.com/new-cover.jpg'
        };

        const response = await request(app)
          .put('/api/profiles/me/cover-photo')
          .set('Authorization', `Bearer ${authToken}`)
          .send(coverData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Cover photo updated successfully');
      });

      test('should require cover photo URL', async () => {
        const response = await request(app)
          .put('/api/profiles/me/cover-photo')
          .set('Authorization', `Bearer ${authToken}`)
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('PUT /api/profiles/me/theme', () => {
      test('should update theme successfully', async () => {
        const themeData = {
          mode: 'dark',
          primaryColor: '#FF0000',
          fontFamily: 'roboto'
        };

        const response = await request(app)
          .put('/api/profiles/me/theme')
          .set('Authorization', `Bearer ${authToken}`)
          .send(themeData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Theme updated successfully');
      });

      test('should validate theme data', async () => {
        const invalidTheme = {
          mode: 'invalid',
          primaryColor: 'invalid-color'
        };

        const response = await request(app)
          .put('/api/profiles/me/theme')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidTheme);

        expect(response.status).toBe(400);
      });
    });

    describe('PUT /api/profiles/me/privacy', () => {
      test('should update privacy settings successfully', async () => {
        const privacyData = {
          profileVisibility: 'friends',
          searchable: false,
          showBirthday: 'nobody'
        };

        const response = await request(app)
          .put('/api/profiles/me/privacy')
          .set('Authorization', `Bearer ${authToken}`)
          .send(privacyData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Privacy settings updated successfully');
      });

      test('should validate privacy settings', async () => {
        const invalidPrivacy = {
          profileVisibility: 'invalid',
          showBirthday: 'invalid'
        };

        const response = await request(app)
          .put('/api/profiles/me/privacy')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidPrivacy);

        expect(response.status).toBe(400);
      });
    });

    describe('PUT /api/profiles/me/widgets', () => {
      test('should update widget layout successfully', async () => {
        const widgetData = {
          enabled: ['about', 'friends', 'photos'],
          layout: [
            { id: 'about', position: 0, size: 'large' },
            { id: 'friends', position: 1, size: 'medium' }
          ]
        };

        const response = await request(app)
          .put('/api/profiles/me/widgets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(widgetData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Widget layout updated successfully');
      });

      test('should validate widget data', async () => {
        const invalidWidgets = {
          enabled: ['invalid-widget'],
          layout: [
            { id: 'about', position: -1 } // Invalid position
          ]
        };

        const response = await request(app)
          .put('/api/profiles/me/widgets')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidWidgets);

        expect(response.status).toBe(400);
      });
    });
  });
}); 