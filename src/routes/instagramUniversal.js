/**
 * Instagram Universal Routes
 * Fallback routes that work with both Instagram Graph API and Basic Display API
 * Use these if you're having issues with the main Instagram Graph API routes
 */

const express = require('express');
const router = express.Router();
const InstagramUniversalService = require('../services/instagramUniversalService');

// Initialize service
const instagramService = new InstagramUniversalService();

// Middleware for logging
router.use((req, res, next) => {
  console.log(`📱 Instagram Universal API: ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

/**
 * @route   GET /instagram-universal/status
 * @desc    Get service status and API type being used
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const status = instagramService.getStatus();
    
    res.json({
      success: true,
      message: 'Instagram Universal Service Status',
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /instagram-universal/profile
 * @desc    Get Instagram profile (works with both APIs)
 * @access  Public
 */
router.get('/profile', async (req, res) => {
  try {
    if (!instagramService.validateCredentials()) {
      return res.status(500).json({
        success: false,
        error: 'No Instagram credentials configured',
        message: 'Please set either IG_ACCESS_TOKEN+IG_USER_ID or INSTAGRAM_ACCESS_TOKEN in environment variables',
        timestamp: new Date().toISOString()
      });
    }

    const result = await instagramService.getProfile();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        api_used: result.api_used,
        message: 'Failed to fetch Instagram profile',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Instagram profile fetched successfully using ${result.api_used}`,
      api_used: result.api_used,
      data: result.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in universal profile controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /instagram-universal/posts
 * @desc    Get Instagram posts (works with both APIs)
 * @access  Public
 */
router.get('/posts', async (req, res) => {
  try {
    if (!instagramService.validateCredentials()) {
      return res.status(500).json({
        success: false,
        error: 'No Instagram credentials configured',
        message: 'Please set either IG_ACCESS_TOKEN+IG_USER_ID or INSTAGRAM_ACCESS_TOKEN in environment variables',
        timestamp: new Date().toISOString()
      });
    }

    let limit = parseInt(req.query.limit) || 25;
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 100',
        timestamp: new Date().toISOString()
      });
    }

    const result = await instagramService.getRecentPosts(limit);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        api_used: result.api_used,
        message: 'Failed to fetch Instagram posts',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: `Fetched ${result.data.posts.length} Instagram posts using ${result.api_used}`,
      api_used: result.api_used,
      data: result.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in universal posts controller:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route   GET /instagram-universal/validate
 * @desc    Validate Instagram access token (works with both APIs)
 * @access  Public
 */
router.get('/validate', async (req, res) => {
  try {
    if (!instagramService.validateCredentials()) {
      return res.status(500).json({
        success: false,
        valid: false,
        error: 'No Instagram credentials configured',
        message: 'Please set either IG_ACCESS_TOKEN+IG_USER_ID or INSTAGRAM_ACCESS_TOKEN in environment variables',
        timestamp: new Date().toISOString()
      });
    }

    const result = await instagramService.validateToken();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: result.error,
        api_used: result.api_used,
        message: 'Instagram access token validation failed',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      message: `Instagram access token is valid (${result.api_used})`,
      api_used: result.api_used,
      data: result.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in universal validate controller:', error);
    return res.status(500).json({
      success: false,
      valid: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Instagram Universal API Error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Instagram Universal API Error',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Instagram Universal API route ${req.method} ${req.originalUrl} not found`,
    available_routes: [
      'GET /instagram-universal/status',
      'GET /instagram-universal/profile',
      'GET /instagram-universal/posts',
      'GET /instagram-universal/validate'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
