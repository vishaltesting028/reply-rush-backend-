const axios = require('axios');
const User = require('../models/User');

class InstagramDataFetcher {
  constructor() {
    this.baseUrl = 'https://graph.instagram.com';
    this.facebookGraphUrl = 'https://graph.facebook.com';
  }

  /**
   * Fetch comprehensive Instagram user profile data
   * @param {string} accessToken - Instagram access token
   * @returns {Object} Profile data
   */
  async fetchUserProfile(accessToken) {
    try {
      // Try Instagram Business API first
      let profileData = await this.fetchBusinessProfile(accessToken);
      
      // Fallback to Basic Display API if Business API fails
      if (!profileData) {
        profileData = await this.fetchBasicProfile(accessToken);
      }

      return {
        success: true,
        data: profileData
      };
    } catch (error) {
      console.error('Error fetching Instagram profile:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Fetch Instagram Business profile data
   * @param {string} accessToken - Instagram access token
   * @returns {Object} Business profile data
   */
  async fetchBusinessProfile(accessToken) {
    try {
      // Get Facebook pages connected to the user
      const pagesResponse = await axios.get(`${this.facebookGraphUrl}/me/accounts`, {
        params: {
          fields: 'instagram_business_account,name,id',
          access_token: accessToken
        }
      });

      if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
        for (const page of pagesResponse.data.data) {
          if (page.instagram_business_account) {
            // Get Instagram Business Account details
            const profileResponse = await axios.get(
              `${this.facebookGraphUrl}/${page.instagram_business_account.id}`,
              {
                params: {
                  fields: 'id,username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url,account_type',
                  access_token: accessToken
                }
              }
            );

            return {
              ...profileResponse.data,
              pageId: page.id,
              pageName: page.name,
              apiType: 'business'
            };
          }
        }
      }
      return null;
    } catch (error) {
      console.log('Business API failed:', error.response?.data);
      return null;
    }
  }

  /**
   * Fetch Instagram Basic Display profile data
   * @param {string} accessToken - Instagram access token
   * @returns {Object} Basic profile data
   */
  async fetchBasicProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      return {
        ...response.data,
        apiType: 'basic'
      };
    } catch (error) {
      console.log('Basic Display API failed:', error.response?.data);
      throw error;
    }
  }

  /**
   * Fetch Instagram media posts
   * @param {string} accessToken - Instagram access token
   * @param {number} limit - Number of posts to fetch (default: 25)
   * @returns {Object} Media posts data
   */
  async fetchUserMedia(accessToken, limit = 25) {
    try {
      // Try Business API first
      let mediaData = await this.fetchBusinessMedia(accessToken, limit);
      
      // Fallback to Basic Display API
      if (!mediaData) {
        mediaData = await this.fetchBasicMedia(accessToken, limit);
      }

      return {
        success: true,
        data: mediaData
      };
    } catch (error) {
      console.error('Error fetching Instagram media:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Fetch Instagram Business media
   * @param {string} accessToken - Instagram access token
   * @param {number} limit - Number of posts to fetch
   * @returns {Array} Media posts array
   */
  async fetchBusinessMedia(accessToken, limit) {
    try {
      // Get Facebook pages connected to the user
      const pagesResponse = await axios.get(`${this.facebookGraphUrl}/me/accounts`, {
        params: {
          fields: 'instagram_business_account',
          access_token: accessToken
        }
      });

      if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
        for (const page of pagesResponse.data.data) {
          if (page.instagram_business_account) {
            const mediaResponse = await axios.get(
              `${this.facebookGraphUrl}/${page.instagram_business_account.id}/media`,
              {
                params: {
                  fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,comments_count,like_count,insights.metric(impressions,reach,engagement)',
                  access_token: accessToken,
                  limit: limit
                }
              }
            );

            return mediaResponse.data.data.map(post => ({
              ...post,
              apiType: 'business',
              engagement: {
                likes: post.like_count || 0,
                comments: post.comments_count || 0,
                impressions: post.insights?.data?.find(i => i.name === 'impressions')?.values?.[0]?.value || 0,
                reach: post.insights?.data?.find(i => i.name === 'reach')?.values?.[0]?.value || 0,
                engagement: post.insights?.data?.find(i => i.name === 'engagement')?.values?.[0]?.value || 0
              }
            }));
          }
        }
      }
      return null;
    } catch (error) {
      console.log('Business media API failed:', error.response?.data);
      return null;
    }
  }

  /**
   * Fetch Instagram Basic Display media
   * @param {string} accessToken - Instagram access token
   * @param {number} limit - Number of posts to fetch
   * @returns {Array} Media posts array
   */
  async fetchBasicMedia(accessToken, limit) {
    try {
      const response = await axios.get(`${this.baseUrl}/me/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink',
          access_token: accessToken,
          limit: limit
        }
      });

      return response.data.data.map(post => ({
        ...post,
        apiType: 'basic',
        engagement: {
          likes: 0,
          comments: 0,
          impressions: 0,
          reach: 0,
          engagement: 0
        }
      }));
    } catch (error) {
      console.log('Basic media API failed:', error.response?.data);
      throw error;
    }
  }

  /**
   * Fetch Instagram Stories (Business API only)
   * @param {string} accessToken - Instagram access token
   * @returns {Object} Stories data
   */
  async fetchUserStories(accessToken) {
    try {
      // Get Facebook pages connected to the user
      const pagesResponse = await axios.get(`${this.facebookGraphUrl}/me/accounts`, {
        params: {
          fields: 'instagram_business_account',
          access_token: accessToken
        }
      });

      if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
        for (const page of pagesResponse.data.data) {
          if (page.instagram_business_account) {
            const storiesResponse = await axios.get(
              `${this.facebookGraphUrl}/${page.instagram_business_account.id}/stories`,
              {
                params: {
                  fields: 'id,media_type,media_url,thumbnail_url,timestamp,permalink',
                  access_token: accessToken
                }
              }
            );

            return {
              success: true,
              data: storiesResponse.data.data || []
            };
          }
        }
      }

      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error fetching Instagram stories:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        data: []
      };
    }
  }

  /**
   * Fetch Instagram account insights (Business API only)
   * @param {string} accessToken - Instagram access token
   * @returns {Object} Insights data
   */
  async fetchAccountInsights(accessToken) {
    try {
      // Get Facebook pages connected to the user
      const pagesResponse = await axios.get(`${this.facebookGraphUrl}/me/accounts`, {
        params: {
          fields: 'instagram_business_account',
          access_token: accessToken
        }
      });

      if (pagesResponse.data.data && pagesResponse.data.data.length > 0) {
        for (const page of pagesResponse.data.data) {
          if (page.instagram_business_account) {
            const insightsResponse = await axios.get(
              `${this.facebookGraphUrl}/${page.instagram_business_account.id}/insights`,
              {
                params: {
                  metric: 'impressions,reach,profile_views,website_clicks',
                  period: 'day',
                  access_token: accessToken
                }
              }
            );

            return {
              success: true,
              data: insightsResponse.data.data || []
            };
          }
        }
      }

      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Error fetching Instagram insights:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        data: []
      };
    }
  }

  /**
   * Store Instagram data in database
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to store
   * @param {Array} mediaData - Media data to store
   * @param {string} accessToken - Access token
   * @returns {Object} Storage result
   */
  async storeInstagramData(userId, profileData, mediaData, accessToken) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update Instagram profile data
      user.instagram = {
        ...user.instagram,
        username: profileData.username,
        accessToken: accessToken,
        instagramUserId: profileData.id,
        accountType: profileData.account_type?.toUpperCase() || 'PERSONAL',
        mediaCount: profileData.media_count || 0,
        followersCount: profileData.followers_count || 0,
        followingCount: profileData.follows_count || 0,
        biography: profileData.biography || '',
        website: profileData.website || '',
        profilePictureUrl: profileData.profile_picture_url || '',
        isConnected: true,
        connectedAt: user.instagram?.connectedAt || new Date(),
        lastSyncAt: new Date(),
        profile: {
          id: profileData.id,
          username: profileData.username,
          name: profileData.name || profileData.username,
          accountType: profileData.account_type || 'PERSONAL',
          mediaCount: profileData.media_count || 0,
          followersCount: profileData.followers_count || 0,
          followingCount: profileData.follows_count || 0,
          biography: profileData.biography || '',
          website: profileData.website || '',
          profilePictureUrl: profileData.profile_picture_url || '',
          lastUpdated: new Date()
        }
      };

      // Store media data
      if (mediaData && mediaData.length > 0) {
        user.instagram.media = mediaData.map(post => ({
          mediaId: post.id,
          mediaType: post.media_type,
          mediaUrl: post.media_url,
          thumbnailUrl: post.thumbnail_url,
          caption: post.caption || '',
          timestamp: new Date(post.timestamp),
          permalink: post.permalink,
          engagement: post.engagement || {
            likes: 0,
            comments: 0,
            impressions: 0,
            reach: 0,
            engagement: 0
          },
          syncedAt: new Date()
        }));
      }

      await user.save();

      return {
        success: true,
        message: 'Instagram data stored successfully',
        data: {
          username: user.instagram.username,
          mediaCount: user.instagram.mediaCount,
          postsStored: mediaData?.length || 0
        }
      };
    } catch (error) {
      console.error('Error storing Instagram data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Comprehensive Instagram data sync
   * @param {string} userId - User ID
   * @param {string} accessToken - Instagram access token
   * @returns {Object} Sync result
   */
  async syncInstagramData(userId, accessToken) {
    try {
      console.log('🔄 Starting comprehensive Instagram data sync...');

      // Fetch profile data
      const profileResult = await this.fetchUserProfile(accessToken);
      if (!profileResult.success) {
        throw new Error(`Profile fetch failed: ${profileResult.error}`);
      }

      // Fetch media data
      const mediaResult = await this.fetchUserMedia(accessToken, 50);
      if (!mediaResult.success) {
        console.warn('Media fetch failed, continuing with profile data only:', mediaResult.error);
      }

      // Fetch stories (optional, Business API only)
      const storiesResult = await this.fetchUserStories(accessToken);
      
      // Fetch insights (optional, Business API only)
      const insightsResult = await this.fetchAccountInsights(accessToken);

      // Store all data in database
      const storeResult = await this.storeInstagramData(
        userId,
        profileResult.data,
        mediaResult.data || [],
        accessToken
      );

      if (!storeResult.success) {
        throw new Error(`Data storage failed: ${storeResult.error}`);
      }

      console.log('✅ Instagram data sync completed successfully');

      return {
        success: true,
        message: 'Instagram data synced successfully',
        data: {
          profile: profileResult.data,
          mediaCount: mediaResult.data?.length || 0,
          storiesCount: storiesResult.data?.length || 0,
          hasInsights: insightsResult.success && insightsResult.data?.length > 0,
          apiType: profileResult.data?.apiType || 'basic'
        }
      };
    } catch (error) {
      console.error('❌ Instagram data sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new InstagramDataFetcher();
