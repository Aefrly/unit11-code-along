const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize database connection
const db = new Sequelize({
    dialect: 'sqlite',
    storage: `database/${process.env.DB_NAME}` || 'blog.db',
    logging: false
});

// User Model
const User = db.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Post Model
const Post = db.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    excerpt: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    tags: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

// Define Relationships
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

module.exports = {
    db,
    User,
    Post
};