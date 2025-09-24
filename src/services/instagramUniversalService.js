/**
 * Instagram Universal Service
 * Supports both Instagram Basic Display API and Instagram Graph API
 * Automatically detects which API to use based on token type and configuration
 */

class InstagramUniversalService {
  constructor() {
    // Try Graph API first (for Business accounts)
    this.graphAccessToken = process.env.IG_ACCESS_TOKEN;
    this.graphUserId = process.env.IG_USER_ID;
    
    // Fallback to Basic Display API
    this.basicAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    
    this.apiType = this.detectApiType();
    console.log(`📱 Instagram Universal Service initialized with: ${this.apiType}`);
  }

  /**
   * Detect which API to use based on available credentials
   */
  detectApiType() {
    if (this.graphAccessToken && this.graphUserId) {
      return 'GRAPH_API';
    } else if (this.basicAccessToken) {
      return 'BASIC_DISPLAY_API';
    } else {
      return 'NONE';
    }
  }

  /**
   * Validate if credentials are available
   */
  validateCredentials() {
    return this.apiType !== 'NONE';
  }

  /**
   * Make request to appropriate Instagram API
   */
  async makeRequest(endpoint, params = {}) {
    if (!this.validateCredentials()) {
      throw new Error('No Instagram credentials configured. Please set either IG_ACCESS_TOKEN+IG_USER_ID or INSTAGRAM_ACCESS_TOKEN in environment variables.');
    }

    if (this.apiType === 'GRAPH_API') {
      return this.makeGraphApiRequest(endpoint, params);
    } else {
      return this.makeBasicApiRequest(endpoint, params);
    }
  }

  /**
   * Make Instagram Graph API request (Business accounts)
   */
  async makeGraphApiRequest(endpoint, params = {}) {
    const baseUrl = 'https://graph.instagram.com';
    const url = new URL(`${baseUrl}${endpoint}`);
    
    params.access_token = this.graphAccessToken;
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    try {
      console.log(`📡 Instagram Graph API Request: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ReplyRush/1.0'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText;
        
        // Handle specific errors with helpful messages
        if (errorMessage.includes('Invalid platform app')) {
          throw new Error(`PLATFORM_APP_ERROR: Your app needs Instagram Graph API access. Switch to Instagram Basic Display API or fix your app configuration. Run 'node diagnose-instagram-issue.js' for help.`);
        }
        
        throw new Error(`Instagram Graph API Error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      console.log(`✅ Instagram Graph API Success: ${endpoint}`);
      return data;
      
    } catch (error) {
      console.error(`❌ Instagram Graph API Error: ${error.message}`);
      
      // If Graph API fails, suggest fallback
      if (this.basicAccessToken && error.message.includes('PLATFORM_APP_ERROR')) {
        console.log('💡 Suggestion: Falling back to Instagram Basic Display API...');
        this.apiType = 'BASIC_DISPLAY_API';
        return this.makeBasicApiRequest(endpoint, params);
      }
      
      throw error;
    }
  }

  /**
   * Make Instagram Basic Display API request (Personal accounts)
   */
  async makeBasicApiRequest(endpoint, params = {}) {
    const baseUrl = 'https://graph.instagram.com';
    let url;
    
    // Map Graph API endpoints to Basic Display API endpoints
    if (endpoint.includes('/media')) {
      url = new URL(`${baseUrl}/me/media`);
    } else if (endpoint.startsWith('/')) {
      url = new URL(`${baseUrl}/me`);
    } else {
      url = new URL(`${baseUrl}${endpoint}`);
    }
    
    params.access_token = this.basicAccessToken;
    
    // Basic Display API has different field names
    if (params.fields) {
      params.fields = this.mapFieldsForBasicApi(params.fields);
    }
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    try {
      console.log(`📡 Instagram Basic Display API Request: ${url.toString()}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ReplyRush/1.0'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Instagram Basic Display API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Instagram Basic Display API Success: ${endpoint}`);
      return data;
      
    } catch (error) {
      console.error(`❌ Instagram Basic Display API Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map Graph API fields to Basic Display API fields
   */
  mapFieldsForBasicApi(fields) {
    const fieldMap = {
      'followers_count': 'account_type', // Basic API doesn't have followers_count
      'media_count': 'media_count',
      'username': 'username',
      'name': 'username', // Basic API uses username for name
      'biography': 'account_type', // Not available in Basic API
      'website': 'account_type', // Not available in Basic API
      'profile_picture_url': 'account_type' // Not available in Basic API
    };
    
    return fields.split(',').map(field => fieldMap[field] || field).join(',');
  }

  /**
   * Get Instagram profile (works with both APIs)
   */
  async getProfile() {
    try {
      let profileData;
      
      if (this.apiType === 'GRAPH_API') {
        const fields = 'id,username,account_type,media_count,followers_count,follows_count,profile_picture_url,name,biography,website';
        profileData = await this.makeRequest(`/${this.graphUserId}`, { fields });
      } else {
        const fields = 'id,username,account_type,media_count';
        profileData = await this.makeRequest('/me', { fields });
      }

      return {
        success: true,
        api_used: this.apiType,
        data: {
          id: profileData.id,
          username: profileData.username,
          name: profileData.name || profileData.username,
          biography: profileData.biography || 'Not available with Basic Display API',
          website: profileData.website || '',
          profile_picture_url: profileData.profile_picture_url || '',
          account_type: profileData.account_type,
          media_count: profileData.media_count || 0,
          followers_count: profileData.followers_count || 'Not available with Basic Display API',
          follows_count: profileData.follows_count || 'Not available with Basic Display API',
          last_updated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
      return {
        success: false,
        api_used: this.apiType,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get recent Instagram posts (works with both APIs)
   */
  async getRecentPosts(limit = 25) {
    try {
      const validLimit = Math.min(Math.max(1, limit), 100);
      let mediaData;
      
      if (this.apiType === 'GRAPH_API') {
        const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count';
        mediaData = await this.makeRequest(`/${this.graphUserId}/media`, {
          fields,
          limit: validLimit
        });
      } else {
        const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
        mediaData = await this.makeRequest('/me/media', {
          fields,
          limit: validLimit
        });
      }

      const posts = mediaData.data || [];

      return {
        success: true,
        api_used: this.apiType,
        data: {
          posts: posts.map(post => ({
            id: post.id,
            caption: post.caption || '',
            media_type: post.media_type,
            media_url: post.media_url,
            thumbnail_url: post.thumbnail_url || post.media_url,
            permalink: post.permalink,
            timestamp: post.timestamp,
            username: post.username || 'N/A',
            like_count: post.like_count || 'Not available with Basic Display API',
            comments_count: post.comments_count || 'Not available with Basic Display API',
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
        api_used: this.apiType,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Validate current access token
   */
  async validateToken() {
    try {
      let tokenInfo;
      
      if (this.apiType === 'GRAPH_API') {
        tokenInfo = await this.makeRequest('/me', { fields: 'id,username' });
      } else {
        tokenInfo = await this.makeRequest('/me', { fields: 'id,username' });
      }

      return {
        success: true,
        valid: true,
        api_used: this.apiType,
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
        api_used: this.apiType,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get service status and configuration
   */
  getStatus() {
    return {
      api_type: this.apiType,
      credentials_available: {
        graph_api: !!(this.graphAccessToken && this.graphUserId),
        basic_display_api: !!this.basicAccessToken
      },
      recommendations: this.getRecommendations()
    };
  }

  /**
   * Get recommendations based on current setup
   */
  getRecommendations() {
    const recommendations = [];
    
    if (this.apiType === 'NONE') {
      recommendations.push('Set up Instagram credentials in environment variables');
      recommendations.push('For Business features: Set IG_ACCESS_TOKEN and IG_USER_ID');
      recommendations.push('For Basic features: Set INSTAGRAM_ACCESS_TOKEN');
    } else if (this.apiType === 'BASIC_DISPLAY_API') {
      recommendations.push('Consider upgrading to Instagram Graph API for Business features');
      recommendations.push('Graph API provides: followers count, insights, posting capabilities');
      recommendations.push('Requires: Instagram Business Account connected to Facebook Page');
    } else if (this.apiType === 'GRAPH_API') {
      recommendations.push('You have the best setup for Instagram integration');
      recommendations.push('All features available: profile, posts, insights, publishing');
    }
    
    return recommendations;
  }
}

module.exports = InstagramUniversalService;
