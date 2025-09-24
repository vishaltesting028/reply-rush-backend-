/**
 * Instagram Graph API Service
 * Production-ready service for Instagram Business Account integration
 * Handles profile info and media fetching with proper error handling
 */

class InstagramGraphService {
  constructor() {
    this.baseUrl = 'https://graph.instagram.com';
    this.accessToken = process.env.IG_ACCESS_TOKEN;
    this.userId = process.env.IG_USER_ID;
    
    if (!this.accessToken) {
      console.warn('⚠️  IG_ACCESS_TOKEN not found in environment variables');
    }
    
    if (!this.userId) {
      console.warn('⚠️  IG_USER_ID not found in environment variables');
    }
  }

  /**
   * Validates if required credentials are available
   * @returns {boolean} True if credentials are valid
   */
  validateCredentials() {
    return !!(this.accessToken && this.userId);
  }

  /**
   * Makes authenticated request to Instagram Graph API
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, params = {}) {
    if (!this.validateCredentials()) {
      throw new Error('Instagram credentials not configured. Please set IG_ACCESS_TOKEN and IG_USER_ID in environment variables.');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add access token to params
    params.access_token = this.accessToken;
    
    // Add all params to URL
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    try {
      console.log(`📡 Instagram API Request: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ReplyRush/1.0'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
n
        
        // Handle specific "Invalid platform app" error
        if (errorMessage.includes('Invalid platform app') || errorMessage.includes('platform app')) {
          throw new Error(`PLATFORM_APP_ERROR: ${errorMessage}. This usually means: 1) Wrong app type (need Business app, not Consumer), 2) Missing Instagram Graph API product, 3) Using Basic Display token for Graph API, or 4) Personal account instead of Business account. Check INSTAGRAM_PLATFORM_APP_FIX.md for solutions.`);
        }
        
        // Handle token-related errors
        if (errorMessage.includes('access token') || errorMessage.includes('token')) {
          throw new Error(`TOKEN_ERROR: ${errorMessage}. Your access token may be expired, invalid, or have insufficient permissions.`);
        }
        
        // Handle permissions errors
        if (errorMessage.includes('permission') || errorMessage.includes('scope')) {
          throw new Error(`PERMISSION_ERROR: ${errorMessage}. Your app may need additional permissions or Instagram Business API access.`);
        }
        
        throw new Error(`Instagram API Error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      console.log(`✅ Instagram API Success: ${endpoint}`);
      
      return data;
    } catch (error) {
      console.error(`❌ Instagram API Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetches Instagram profile information
   * @returns {Promise<Object>} Profile data including username, followers_count, media_count
   */
  async getProfile() {
    try {
      const fields = [
        'id',
        'username',
        'account_type',
        'media_count',
        'followers_count',
        'follows_count',
        'profile_picture_url',
        'name',
        'biography',
        'website'
      ].join(',');

      const profileData = await this.makeRequest(`/${this.userId}`, {
        fields: fields
      });

      return {
        success: true,
        data: {
          id: profileData.id,
          username: profileData.username,
          name: profileData.name || profileData.username,
          biography: profileData.biography || '',
          website: profileData.website || '',
          profile_picture_url: profileData.profile_picture_url,
          account_type: profileData.account_type,
          media_count: profileData.media_count || 0,
          followers_count: profileData.followers_count || 0,
          follows_count: profileData.follows_count || 0,
          last_updated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Fetches recent Instagram media posts
   * @param {number} limit - Number of posts to fetch (default: 25, max: 100)
   * @returns {Promise<Object>} Media data with posts array
   */
  async getRecentPosts(limit = 25) {
    try {
      // Ensure limit is within Instagram's bounds
      const validLimit = Math.min(Math.max(1, limit), 100);

      const fields = [
        'id',
        'caption',
        'media_type',
        'media_url',
        'permalink',
        'thumbnail_url',
        'timestamp',
        'username',
        'like_count',
        'comments_count'
      ].join(',');

      const mediaData = await this.makeRequest(`/${this.userId}/media`, {
        fields: fields,
        limit: validLimit
      });

      const posts = mediaData.data || [];

      return {
        success: true,
        data: {
          posts: posts.map(post => ({
            id: post.id,
            caption: post.caption || '',
            media_type: post.media_type,
            media_url: post.media_url,
            thumbnail_url: post.thumbnail_url || post.media_url,
            permalink: post.permalink,
            timestamp: post.timestamp,
            username: post.username,
            like_count: post.like_count || 0,
            comments_count: post.comments_count || 0,
            formatted_date: new Date(post.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          })),
          total_count: posts.length,
          has_next_page: !!(mediaData.paging && mediaData.paging.next),
          next_cursor: mediaData.paging?.cursors?.after || null,
          last_updated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Fetches specific media post by ID
   * @param {string} mediaId - Instagram media ID
   * @returns {Promise<Object>} Single media post data
   */
  async getMediaById(mediaId) {
    try {
      const fields = [
        'id',
        'caption',
        'media_type',
        'media_url',
        'permalink',
        'thumbnail_url',
        'timestamp',
        'username',
        'like_count',
        'comments_count'
      ].join(',');

      const mediaData = await this.makeRequest(`/${mediaId}`, {
        fields: fields
      });

      return {
        success: true,
        data: {
          id: mediaData.id,
          caption: mediaData.caption || '',
          media_type: mediaData.media_type,
          media_url: mediaData.media_url,
          thumbnail_url: mediaData.thumbnail_url || mediaData.media_url,
          permalink: mediaData.permalink,
          timestamp: mediaData.timestamp,
          username: mediaData.username,
          like_count: mediaData.like_count || 0,
          comments_count: mediaData.comments_count || 0,
          formatted_date: new Date(mediaData.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
      };
    } catch (error) {
      console.error(`Error fetching Instagram media ${mediaId}:`, error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Validates the current access token
   * @returns {Promise<Object>} Token validation result
   */
  async validateToken() {
    try {
      const tokenInfo = await this.makeRequest('/me', {
        fields: 'id,username'
      });

      return {
        success: true,
        valid: true,
        data: {
          user_id: tokenInfo.id,
          username: tokenInfo.username,
          validated_at: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Gets Instagram account insights (requires Business account)
   * @param {string} metric - Metric to fetch (impressions, reach, profile_views)
   * @param {string} period - Time period (day, week, days_28)
   * @returns {Promise<Object>} Insights data
   */
  async getInsights(metric = 'impressions,reach,profile_views', period = 'day') {
    try {
      const insightsData = await this.makeRequest(`/${this.userId}/insights`, {
        metric: metric,
        period: period
      });

      return {
        success: true,
        data: {
          insights: insightsData.data || [],
          period: period,
          last_updated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching Instagram insights:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

module.exports = InstagramGraphService;
