const express = require('express');
const {
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  fetchLatestStories,
  getStoriesStats,
  cleanupExpiredStories,
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getStories)
  .post(protect, createStory);

router.route('/stats')
  .get(protect, getStoriesStats);

router.route('/fetch-latest')
  .post(protect, fetchLatestStories);

router.route('/cleanup-expired')
  .delete(protect, cleanupExpiredStories);

router.route('/:id')
  .get(protect, getStory)
  .put(protect, updateStory)
  .delete(protect, deleteStory);

module.exports = router;
