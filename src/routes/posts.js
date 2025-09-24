const express = require('express');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  fetchLatestPosts,
  getPostsStats,
} = require('../controllers/postController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getPosts)
  .post(protect, createPost);

router.route('/stats')
  .get(protect, getPostsStats);

router.route('/fetch-latest')
  .post(protect, fetchLatestPosts);

router.route('/:id')
  .get(protect, getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

module.exports = router;
