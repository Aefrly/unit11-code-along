const { db, User, Post } = require('./setup');

// Initialize database
async function initializeDatabase() {
    try {
        await db.authenticate();
        console.log('Database connection established successfully.');
        
        await db.sync({ force: false });
        console.log('Database synchronized successfully.');
        
        // Create sample data
        const existingUsers = await User.findAll();
        if (existingUsers.length === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 10);
            
            const users = await User.bulkCreate([
                {
                    username: 'techblogger',
                    email: 'tech@example.com',
                    password: hashedPassword,
                    firstName: 'Alex',
                    lastName: 'Johnson'
                },
                {
                    username: 'writergirl',
                    email: 'writer@example.com',
                    password: hashedPassword,
                    firstName: 'Sarah',
                    lastName: 'Davis'
                }
            ]);
            
            // Create sample posts
            await Post.bulkCreate([
                {
                    title: 'Introduction to Node.js',
                    content: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine. It allows developers to use JavaScript for server-side programming...',
                    excerpt: 'Learn the basics of Node.js and how it revolutionized server-side development.',
                    published: true,
                    tags: 'nodejs, javascript, backend',
                    authorId: users[0].id
                },
                {
                    title: 'Building REST APIs with Express',
                    content: 'Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications...',
                    excerpt: 'A comprehensive guide to building RESTful APIs using Express.js.',
                    published: true,
                    tags: 'express, api, rest',
                    authorId: users[0].id
                },
                {
                    title: 'The Art of Writing Clean Code',
                    content: 'Writing clean, maintainable code is one of the most important skills a developer can have. Clean code is not just about making your code work...',
                    excerpt: 'Tips and techniques for writing code that is easy to read, understand, and maintain.',
                    published: false,
                    tags: 'clean code, best practices, development',
                    authorId: users[1].id
                }
            ]);
            
            console.log('Sample data created successfully.');
        }
        
    } catch (error) {
        console.error('Unable to connect to database:', error);
    }
}

initializeDatabase();