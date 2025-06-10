const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { clerk } = require('../config/clerk');

// Post Schema
const postSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    likes: [{
        type: String  // Array of user IDs who liked the post
    }],
    comments: [{
        userId: String,
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Post = mongoose.model('Post', postSchema);

// Middleware to verify user authentication
const authenticateUser = async (req, res, next) => {
    try {
        const sessionId = req.headers.authorization?.split(' ')[1];
        if (!sessionId) {
            return res.status(401).json({ error: 'No session token provided' });
        }

        const session = await clerk.sessions.verifySession(sessionId);
        req.user = session;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid session token' });
    }
};

// Create a new post
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { content, image } = req.body;
        const newPost = new Post({
            userId: req.user.userId,
            content,
            image
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'username profilePicture');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a specific post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('userId', 'username profilePicture');
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a post
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.userId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized to update this post' });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a post
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        if (post.userId !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this post' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Like/Unlike a post
router.put('/:id/like', authenticateUser, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const likeIndex = post.likes.indexOf(req.user.userId);
        if (likeIndex === -1) {
            // Like the post
            post.likes.push(req.user.userId);
        } else {
            // Unlike the post
            post.likes.splice(likeIndex, 1);
        }

        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a comment to a post
router.post('/:id/comment', authenticateUser, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const newComment = {
            userId: req.user.userId,
            content: req.body.content
        };

        post.comments.push(newComment);
        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 