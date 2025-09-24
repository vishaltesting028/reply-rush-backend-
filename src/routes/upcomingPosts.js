const express = require('express');
const {
  getUpcomingPosts,
  getUpcomingPost,
  createUpcomingPost,
  updateUpcomingPost,
  deleteUpcomingPost,
  saveUpcomingPostConfig,
  cancelUpcomingPost,
  getUpcomingPostsStats,
} = require('../controllers/upcomingPostController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getUpcomingPosts)
  .post(protect, createUpcomingPost);

router.route('/stats')
  .get(protect, getUpcomingPostsStats);

router.route('/save-config')
  .post(protect, saveUpcomingPostConfig);

router.route('/:id')
  .get(protect, getUpcomingPost)
  .put(protect, updateUpcomingPost)
  .delete(protect, deleteUpcomingPost);

router.route('/:id/cancel')
  .put(protect, cancelUpcomingPost);

module.exports = router;
