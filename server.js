const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, User, Post } = require('./database/setup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// JWT Authentication Middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: 'Access denied. No token provided.' 
        });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired. Please log in again.' 
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token. Please log in again.' 
            });
        } else {
            return res.status(401).json({ 
                error: 'Token verification failed.' 
            });
        }
    }
}

// Test database connection
async function testConnection() {
    try {
        await db.authenticate();
        console.log('Connection to database established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Blog API is running',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Blog API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            register: 'POST /api/register',
            login: 'POST /api/login',
            posts: 'GET /api/posts',
            myPosts: 'GET /api/posts/my (requires auth)',
            createPost: 'POST /api/posts (requires auth)',
            updatePost: 'PUT /api/posts/:id (requires auth)',
            deletePost: 'DELETE /api/posts/:id (requires auth)'
        }
    });
});

// AUTHENTICATION ROUTES

// POST /api/register - Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;
        
        // Validate input
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ 
                error: 'All fields are required: username, email, password, firstName, lastName' 
            });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ 
            where: { 
                [db.Op.or]: [
                    { email: email },
                    { username: username }
                ]
            } 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User with this email or username already exists' 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName
        });
        
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            }
        });
        
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// POST /api/login - User login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }
        
        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        res.json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
        
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// POST ROUTES

// GET /api/posts - Get all published posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.findAll({
            where: { published: true },
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['username', 'firstName', 'lastName']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            message: 'Posts retrieved successfully',
            posts: posts,
            total: posts.length
        });
        
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// GET /api/posts/my - Get current user's posts
app.get('/api/posts/my', requireAuth, async (req, res) => {
    try {
        const posts = await Post.findAll({
            where: { authorId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            message: 'Your posts retrieved successfully',
            posts: posts,
            total: posts.length
        });
        
    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ error: 'Failed to fetch your posts' });
    }
});

// GET /api/posts/:id - Get single post
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['username', 'firstName', 'lastName']
                }
            ]
        });
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Only show unpublished posts to the author
        if (!post.published && (!req.user || req.user.id !== post.authorId)) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        res.json(post);
        
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// POST /api/posts - Create new post
app.post('/api/posts', requireAuth, async (req, res) => {
    try {
        const { title, content, excerpt, published = false, tags } = req.body;
        
        // Validate input
        if (!title || !content) {
            return res.status(400).json({ 
                error: 'Title and content are required' 
            });
        }
        
        // Create post
        const newPost = await Post.create({
            title,
            content,
            excerpt,
            published,
            tags,
            authorId: req.user.id
        });
        
        res.status(201).json({
            message: 'Post created successfully',
            post: newPost
        });
        
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// PUT /api/posts/:id - Update post
app.put('/api/posts/:id', requireAuth, async (req, res) => {
    try {
        const { title, content, excerpt, published, tags } = req.body;
        
        // Find post
        const post = await Post.findByPk(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Check if user owns the post
        if (post.authorId !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own posts' });
        }
        
        // Update post
        await post.update({
            title: title || post.title,
            content: content || post.content,
            excerpt: excerpt !== undefined ? excerpt : post.excerpt,
            published: published !== undefined ? published : post.published,
            tags: tags !== undefined ? tags : post.tags
        });
        
        res.json({
            message: 'Post updated successfully',
            post: post
        });
        
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// DELETE /api/posts/:id - Delete post
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    try {
        // Find post
        const post = await Post.findByPk(req.params.id);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Check if user owns the post
        if (post.authorId !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own posts' });
        }
        
        // Delete post
        await post.destroy();
        
        res.json({
            message: 'Post deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        message: `${req.method} ${req.path} is not a valid endpoint`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});