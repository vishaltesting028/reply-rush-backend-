const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class InstagramContentPublisher {
  constructor() {
    this.facebookGraphUrl = 'https://graph.facebook.com';
    this.apiVersion = 'v18.0';
  }

  /**
   * Get Instagram Business Account ID from access token
   * @param {string} accessToken - Facebook/Instagram access token
   * @returns {Object} Business account info
   */
  async getInstagramBusinessAccount(accessToken) {
    try {
      const response = await axios.get(`${this.facebookGraphUrl}/${this.apiVersion}/me/accounts`, {
        params: {
          fields: 'instagram_business_account',
          access_token: accessToken
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        for (const page of response.data.data) {
          if (page.instagram_business_account) {
            return {
              success: true,
              data: {
                businessAccountId: page.instagram_business_account.id,
                pageId: page.id
              }
            };
          }
        }
      }

      return {
        success: false,
        error: 'No Instagram Business Account found. Please ensure your Instagram account is connected to a Facebook Page and converted to a Business account.'
      };
    } catch (error) {
      console.error('Error getting Instagram Business Account:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Upload image to Instagram (single photo post)
   * @param {string} accessToken - Instagram access token
   * @param {string} imageUrl - URL of the image to upload
   * @param {string} caption - Caption for the post
   * @returns {Object} Upload result
   */
  async uploadSinglePhoto(accessToken, imageUrl, caption = '') {
    try {
      // Get Instagram Business Account ID
      const accountResult = await this.getInstagramBusinessAccount(accessToken);
      if (!accountResult.success) {
        return accountResult;
      }

      const { businessAccountId } = accountResult.data;

      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${this.facebookGraphUrl}/${this.apiVersion}/${businessAccountId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish the media container
      const publishResponse = await axios.post(
        `${this.facebookGraphUrl}/${this.apiVersion}/${businessAccountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken
        }
      );

      return {
        success: true,
        data: {
          mediaId: publishResponse.data.id,
          containerId: containerId,
          message: 'Photo uploaded successfully to Instagram'
        }
      };
    } catch (error) {
      console.error('Error uploading photo to Instagram:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Upload carousel (multiple photos) to Instagram
   * @param {string} accessToken - Instagram access token
   * @param {Array} imageUrls - Array of image URLs
   * @param {string} caption - Caption for the post
   * @returns {Object} Upload result
   */
  async uploadCarousel(accessToken, imageUrls, caption = '') {
    try {
      if (!Array.isArray(imageUrls) || imageUrls.length < 2 || imageUrls.length > 10) {
        return {
          success: false,
          error: 'Carousel must contain between 2 and 10 images'
        };
      }

      // Get Instagram Business Account ID
      const accountResult = await this.getInstagramBusinessAccount(accessToken);
      if (!accountResult.success) {
        return accountResult;
      }

      const { businessAccountId } = accountResult.data;

      // Step 1: Create media containers for each image
      const containerIds = [];
      for (const imageUrl of imageUrls) {
        const containerResponse = await axios.post(
          `${this.facebookGraphUrl}/${this.apiVersion}/${businessAccountId}/media`,
          {
            image_url: imageUrl,
            is_carousel_item: true,
            access_token: accessToken
          }
        );
        containerIds.push(containerResponse.data.id);
      }

      // Step 2: Create carousel container
      const carouselResponse = await axios.post(
        `${this.facebookGraphUrl}/${this.apiVersion}/${businessAccountId}/media`,
        {
          media_type: 'CAROUSEL',
          children: containerIds.join(','),
          caption: caption,
          access_token: accessToken
        }
      );

      const carouselContainerId = carouselResponse.data.id;

      // Step 3: Publish the carousel
      const publishResponse = await axios.post(
        `${this.facebookGraphUrl}/${this.apiVersion}/${businessAccountId}/media_publish`,
        {
          creation_id: carouselContainerId,
          access_token: accessToken
        }
      );

      return {
        success: true,
        data: {
          mediaId: publishResponse.data.id,
          containerId: carouselContainerId,
          itemCount: imageUrls.length,
          message: 'Carousel uploaded successfully to Instagram'
        }
      };
    } catch (error) {
      console.error('Error uploading carousel to Instagram:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Upload video to Instagram
   * @param {string} accessToken - Instagram access token
   * @param {string} videoUrl - URL of the video to upload
   * @param {string} caption - Caption for the post
   * @param {string} thumbnailUrl - Optional thumbnail URL
   * @returns {Object} Upload result
   */
  async uploadVideo(accessToken, videoUrl, caption = '', thumbnailUrl = null) {
    try {
      // Get Instagram Business Account ID
      const accountResult = await this.getInstagramBusinessAccount(accessToken);
      if (!accountResult.success) {
        return accountResult;
      }

      const { businessAccountId } = accountResult.data;

      // Step 1: Create video container
      const containerData = {
        media_type: 'VIDEO',
        video_url: videoUrl,
        caption: caption,
        access_token: accessToken
      };

      if (thumbnailUrl) {
        containerData.thumb_offset = 0; // Use first frame as thumbnail or specify offset
      }

      const containerResponse = await axios.post(
        `${this.facebookGraphUrl}/${this.apiVersion}/${businessAccountId}/media`,
        containerData
      );

      const containerId = containerResponse.data.id;

      // Step 2: Check container status (videos need processing time)
      let containerStatus = 'IN_PROGRESS';
      let attempts = 0;
      const maxAttempts = 30; // Wait up to 5 minutes

      while (containerStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        
        const statusResponse = await axios.get(
          `${this.facebookGraphUrl}/${this.apiVersion}/${containerId}`,
          {
            params: {
              fields: 'status_code',
              access_token: accessToken
            }
          }
        );

        containerStatus = statusResponse.data.status_code;
        attempts++;
      }

      if (containerStatus !== 'FINISHED') {
        return {
          success: false,
          error: `Video processing failed or timed out. Status: ${containerStatus}`
        };
      }

      // Step 3: Publish the video
      const publishResponse = await axios.post(
        `${this.facebookGraphUrl}/${this.apiVersion}/${businessAccountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken
        }
      );

      return {
        success: true,
        data: {
          mediaId: publishResponse.data.id,
          containerId: containerId,
          message: 'Video uploaded successfully to Instagram'
        }
      };
    } catch (error) {
      console.error('Error uploading video to Instagram:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Upload Instagram Story
   * @param {string} accessToken - Instagram access token
   * @param {string} mediaUrl - URL of the image/video for story
   * @param {string} mediaType - 'IMAGE' or 'VIDEO'
   * @returns {Object} Upload result
   */
  async uploadStory(accessToken, mediaUrl, mediaType = 'IMAGE') {
    try {
      // Get Instagram Business Account ID
      const accountResult = await this.getInstagramBusinessAccount(accessToken);
      if (!accountResult.success) {
        return accountResult;
      }

      const { businessAccountId } = accountResult.data;

      // Step 1: Create story container
      const containerData = {
        media_type: mediaType,
        access_token: accessToken
      };

      if (mediaType === 'IMAGE') {
        containerData.image_url = mediaUrl;
      } else if (mediaType === 'VIDEO') {
        containerData.video_url = mediaUrl;
      }

      const containerResponse = await axios.post(
        `${this.facebookGraphUrl}/${this.apiVersion}/${businessAccountId}/media`,
        containerData
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish the story
      const publishResponse = await axios.post(
        `${this.facebookGraphUrl}/${this.apiVersion}/${businessAccountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken
        }
      );

      return {
        success: true,
        data: {
          mediaId: publishResponse.data.id,
          containerId: containerId,
          message: 'Story uploaded successfully to Instagram'
        }
      };
    } catch (error) {
      console.error('Error uploading story to Instagram:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        code: error.response?.data?.error?.code
      };
    }
  }

  /**
   * Get media upload status
   * @param {string} accessToken - Instagram access token
   * @param {string} containerId - Media container ID
   * @returns {Object} Status result
   */
  async getMediaStatus(accessToken, containerId) {
    try {
      const response = await axios.get(
        `${this.facebookGraphUrl}/${this.apiVersion}/${containerId}`,
        {
          params: {
            fields: 'status_code,status',
            access_token: accessToken
          }
        }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting media status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
}

module.exports = new InstagramContentPublisher();
