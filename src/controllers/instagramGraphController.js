/**
 * Instagram Graph API Controller
 * Production-ready controller for Instagram Business Account endpoints
 * Handles HTTP requests and responses with proper error handling and validation
 */

const InstagramGraphService = require('../services/instagramGraphService');

class InstagramGraphController {
  constructor() {
    this.instagramService = new InstagramGraphService();
  }

  /**
   * Get Instagram profile information
   * GET /instagram/profile
   */
  async getProfile(req, res) {
    try {
      console.log('📱 Fetching Instagram profile...');

      // Validate credentials before making request
      if (!this.instagramService.validateCredentials()) {
        return res.status(500).json({
          success: false,
          error: 'Instagram credentials not configured',
          message: 'Please configure IG_ACCESS_TOKEN and IG_USER_ID in environment variables',
          timestamp: new Date().toISOString()
        });
      }

      const result = await this.instagramService.getProfile();

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch Instagram profile',
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Instagram profile fetched successfully',
        data: result.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in getProfile controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get Instagram recent posts
   * GET /instagram/posts?limit=25
   */
  async getPosts(req, res) {
    try {
      console.log('📸 Fetching Instagram posts...');

      // Validate credentials before making request
      if (!this.instagramService.validateCredentials()) {
        return res.status(500).json({
          success: false,
          error: 'Instagram credentials not configured',
          message: 'Please configure IG_ACCESS_TOKEN and IG_USER_ID in environment variables',
          timestamp: new Date().toISOString()
        });
      }

      // Parse and validate limit parameter
      let limit = parseInt(req.query.limit) || 25;
      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid limit parameter',
          message: 'Limit must be between 1 and 100',
          timestamp: new Date().toISOString()
        });
      }

      const result = await this.instagramService.getRecentPosts(limit);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch Instagram posts',
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        message: `Fetched ${result.data.posts.length} Instagram posts`,
        data: result.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in getPosts controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get specific Instagram media by ID
   * GET /instagram/media/:mediaId
   */
  async getMediaById(req, res) {
    try {
      const { mediaId } = req.params;

      if (!mediaId) {
        return res.status(400).json({
          success: false,
          error: 'Missing media ID',
          message: 'Media ID is required',
          timestamp: new Date().toISOString()
        });
      }

      console.log(`📸 Fetching Instagram media: ${mediaId}`);

      // Validate credentials before making request
      if (!this.instagramService.validateCredentials()) {
        return res.status(500).json({
          success: false,
          error: 'Instagram credentials not configured',
          message: 'Please configure IG_ACCESS_TOKEN and IG_USER_ID in environment variables',
          timestamp: new Date().toISOString()
        });
      }

      const result = await this.instagramService.getMediaById(mediaId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch Instagram media',
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Instagram media fetched successfully',
        data: result.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in getMediaById controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate Instagram access token
   * GET /instagram/validate
   */
  async validateToken(req, res) {
    try {
      console.log('🔐 Validating Instagram access token...');

      // Check if credentials exist
      if (!this.instagramService.validateCredentials()) {
        return res.status(500).json({
          success: false,
          valid: false,
          error: 'Instagram credentials not configured',
          message: 'Please configure IG_ACCESS_TOKEN and IG_USER_ID in environment variables',
          timestamp: new Date().toISOString()
        });
      }

      const result = await this.instagramService.validateToken();

      if (!result.success) {
        return res.status(400).json({
          success: false,
          valid: false,
          error: result.error,
          message: 'Instagram access token is invalid or expired',
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        valid: true,
        message: 'Instagram access token is valid',
        data: result.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in validateToken controller:', error);
      return res.status(500).json({
        success: false,
        valid: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get Instagram account insights
   * GET /instagram/insights?metric=impressions,reach&period=day
   */
  async getInsights(req, res) {
    try {
      console.log('📊 Fetching Instagram insights...');

      // Validate credentials before making request
      if (!this.instagramService.validateCredentials()) {
        return res.status(500).json({
          success: false,
          error: 'Instagram credentials not configured',
          message: 'Please configure IG_ACCESS_TOKEN and IG_USER_ID in environment variables',
          timestamp: new Date().toISOString()
        });
      }

      const metric = req.query.metric || 'impressions,reach,profile_views';
      const period = req.query.period || 'day';

      // Validate period parameter
      const validPeriods = ['day', 'week', 'days_28'];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid period parameter',
          message: 'Period must be one of: day, week, days_28',
          timestamp: new Date().toISOString()
        });
      }

      const result = await this.instagramService.getInsights(metric, period);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to fetch Instagram insights',
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Instagram insights fetched successfully',
        data: result.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in getInsights controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Health check endpoint for Instagram Graph API integration
   * GET /instagram/health
   */
  async healthCheck(req, res) {
    try {
      const hasCredentials = this.instagramService.validateCredentials();
      
      let tokenStatus = null;
      if (hasCredentials) {
        const tokenValidation = await this.instagramService.validateToken();
        tokenStatus = {
          valid: tokenValidation.valid,
          error: tokenValidation.error || null
        };
      }

      return res.status(200).json({
        success: true,
        message: 'Instagram Graph API health check',
        data: {
          service_status: 'operational',
          credentials_configured: hasCredentials,
          token_status: tokenStatus,
          environment: {
            has_access_token: !!process.env.IG_ACCESS_TOKEN,
            has_user_id: !!process.env.IG_USER_ID,
            node_env: process.env.NODE_ENV || 'development'
          },
          last_checked: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in healthCheck controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Health check failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = InstagramGraphController;
