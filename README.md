# Verse Social Media Platform

Verse is a modern, privacy-focused social media platform designed for meaningful connections and vibrant communities. The platform emphasizes user customization, real-time communication, and community-building through groups, while maintaining strong privacy controls and a beautiful user experience.

Featuring a Node.js (Express.js) backend with a Vue.js frontend.

## 🔒 Portfolio Security Notice
**This repository is configured for portfolio demonstration and code review purposes only.**

### What's Included (For Review):
- ✅ Complete source code structure
- ✅ Controllers, models, and business logic
- ✅ API endpoints and routing
- ✅ Frontend components and views
- ✅ Database schema design (code only)
- ✅ Testing frameworks and test cases
- ✅ Architecture and design patterns

## 📁 Project Structure

```
Verse/
├── backend-nodejs/    # Node.js backend (Express.js)
├── frontend/          # Vue.js frontend application
└── README.md         # This file
```

## 🚀 Technology Stack

### Backend (Node.js)
- **Express.js** - Web framework
- **PostgreSQL** - Database with Sequelize ORM
- **JWT** - Authentication with refresh tokens
- **Joi** - Data validation
- **Jest** - Testing framework
- **Winston** - Logging

### Frontend (Vue.js)
- **Vue 3** - Progressive framework
- **Vue Router** - Client-side routing
- **Vuex** - State management
- **Axios** - HTTP client
- **Vite** - Build tool

### Key Features
- 🔐 JWT-based authentication
- 👥 User profiles and social connections
- 📝 Posts with media support and privacy controls
- 💬 Threaded comments system
- 👍 Reactions and engagement tracking
- 🏢 Groups with role-based permissions
- 🔔 Real-time notifications (planned)
- 📱 Responsive design

## 📋 Architecture Overview

### Database Design
- **UUID Primary Keys** for all entities
- **JSONB Fields** for flexible data storage
- **Materialized Path** for comment threading
- **Polymorphic Associations** for reactions
- **Comprehensive Indexing** for performance

### Security Features
- Password hashing with bcrypt
- JWT tokens with automatic refresh
- Rate limiting and CORS protection
- Input validation on all endpoints
- Permission-based access control

### API Structure
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/profiles/:id
POST   /api/posts
GET    /api/posts/:id/comments
POST   /api/groups
PUT    /api/groups/:id/members/:userId
``` 