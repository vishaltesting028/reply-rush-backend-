/**
 * Instagram Graph API Routes
 * Production-ready routes for Instagram Business Account integration
 * Provides clean API endpoints for frontend consumption
 */

const express = require('express');
const router = express.Router();
const InstagramGraphController = require('../controllers/instagramGraphController');

// Initialize controller
const instagramController = new InstagramGraphController();

// Middleware for logging requests
router.use((req, res, next) => {
  console.log(`📱 Instagram Graph API: ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Middleware for setting response headers
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Service', 'Instagram-Graph-API');
  next();
});

/**
 * @route   GET /instagram/health
 * @desc    Health check for Instagram Graph API integration
 * @access  Public
 * @returns {Object} Service status and configuration info
 */
router.get('/health', async (req, res) => {
  await instagramController.healthCheck(req, res);
});

/**
 * @route   GET /instagram/validate
 * @desc    Validate Instagram access token
 * @access  Public
 * @returns {Object} Token validation result
 */
router.get('/validate', async (req, res) => {
  await instagramController.validateToken(req, res);
});

/**
 * @route   GET /instagram/profile
 * @desc    Get Instagram profile information
 * @access  Public
 * @returns {Object} Profile data including username, followers_count, media_count
 * @example
 * Response:
 * {
 *   "success": true,
 *   "message": "Instagram profile fetched successfully",
 *   "data": {
 *     "id": "17841400455970028",
 *     "username": "your_username",
 *     "name": "Your Name",
 *     "biography": "Your bio",
 *     "website": "https://yourwebsite.com",
 *     "profile_picture_url": "https://...",
 *     "account_type": "BUSINESS",
 *     "media_count": 150,
 *     "followers_count": 1000,
 *     "follows_count": 500,
 *     "last_updated": "2024-01-01T00:00:00.000Z"
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/profile', async (req, res) => {
  await instagramController.getProfile(req, res);
});

/**
 * @route   GET /instagram/posts
 * @desc    Get recent Instagram media posts
 * @access  Public
 * @query   {number} limit - Number of posts to fetch (1-100, default: 25)
 * @returns {Object} Array of recent posts with metadata
 * @example
 * GET /instagram/posts?limit=10
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Fetched 10 Instagram posts",
 *   "data": {
 *     "posts": [
 *       {
 *         "id": "17841400455970028",
 *         "caption": "Your post caption",
 *         "media_type": "IMAGE",
 *         "media_url": "https://...",
 *         "thumbnail_url": "https://...",
 *         "permalink": "https://www.instagram.com/p/...",
 *         "timestamp": "2024-01-01T00:00:00+0000",
 *         "username": "your_username",
 *         "like_count": 100,
 *         "comments_count": 10,
 *         "formatted_date": "January 1, 2024"
 *       }
 *     ],
 *     "total_count": 10,
 *     "has_next_page": true,
 *     "next_cursor": "cursor_string",
 *     "last_updated": "2024-01-01T00:00:00.000Z"
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/posts', async (req, res) => {
  await instagramController.getPosts(req, res);
});

/**
 * @route   GET /instagram/media/:mediaId
 * @desc    Get specific Instagram media by ID
 * @access  Public
 * @param   {string} mediaId - Instagram media ID
 * @returns {Object} Single media post data
 * @example
 * GET /instagram/media/17841400455970028
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Instagram media fetched successfully",
 *   "data": {
 *     "id": "17841400455970028",
 *     "caption": "Your post caption",
 *     "media_type": "IMAGE",
 *     "media_url": "https://...",
 *     "thumbnail_url": "https://...",
 *     "permalink": "https://www.instagram.com/p/...",
 *     "timestamp": "2024-01-01T00:00:00+0000",
 *     "username": "your_username",
 *     "like_count": 100,
 *     "comments_count": 10,
 *     "formatted_date": "January 1, 2024"
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/media/:mediaId', async (req, res) => {
  await instagramController.getMediaById(req, res);
});

/**
 * @route   GET /instagram/insights
 * @desc    Get Instagram account insights (Business accounts only)
 * @access  Public
 * @query   {string} metric - Metrics to fetch (default: impressions,reach,profile_views)
 * @query   {string} period - Time period (day, week, days_28, default: day)
 * @returns {Object} Account insights data
 * @example
 * GET /instagram/insights?metric=impressions,reach&period=week
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Instagram insights fetched successfully",
 *   "data": {
 *     "insights": [
 *       {
 *         "name": "impressions",
 *         "period": "week",
 *         "values": [
 *           {
 *             "value": 1000,
 *             "end_time": "2024-01-01T00:00:00+0000"
 *           }
 *         ]
 *       }
 *     ],
 *     "period": "week",
 *     "last_updated": "2024-01-01T00:00:00.000Z"
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.get('/insights', async (req, res) => {
  await instagramController.getInsights(req, res);
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('❌ Instagram Graph API Error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Instagram Graph API Error',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes in this router
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Instagram Graph API route ${req.method} ${req.originalUrl} not found`,
    available_routes: [
      'GET /instagram/health',
      'GET /instagram/validate', 
      'GET /instagram/profile',
      'GET /instagram/posts',
      'GET /instagram/media/:mediaId',
      'GET /instagram/insights'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
