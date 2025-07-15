# Blog API

A REST API for managing blog posts with user authentication, built with Node.js, Express, and SQLite.

## Features

- User registration and authentication
- JWT-based authentication
- CRUD operations for blog posts
- User-specific post management
- Published/draft post functionality
- SQLite database with Sequelize ORM

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user

### Posts
- `GET /api/posts` - Get all published posts
- `GET /api/posts/:id` - Get single post
- `GET /api/posts/my` - Get current user's posts (protected)
- `POST /api/posts` - Create new post (protected)
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)

### Utility
- `GET /health` - Health check endpoint
- `GET /` - API information

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
    ```bash
    npm start
    ```
3. The API will be available at `http://localhost:3000`

### Sample Users
The database includes sample users for testing:
- **tech@example.com** / password123 (Alex Johnson)
- **writer@example.com** / password123 (Sarah Davis)

### Testing

**Register a user:**
```bash
POST /api/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**
```bash
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Create a blog post (requires authentication):**
```bash
POST /api/posts
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "title": "My First Blog Post",
  "content": "This is the content of my blog post...",
  "excerpt": "A brief summary of the post",
  "published": true,
  "tags": "javascript, node, tutorial"
}
```

### Database
This API uses SQLite for simplicity. The database file (blog.db) will be created automatically when you start the server.
Note for deployment: SQLite databases on platforms like Render will reset when containers restart. For persistent storage in production, consider upgrading to PostgreSQL.

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - JWT token expiration time
- `DB_NAME` - Database file name

### Deployment
This API is ready to deploy to cloud platforms like Render. Make sure to:
1. Set appropriate environment variables
2. Use a secure JWT secret in production
3. Consider database limitations with SQLite