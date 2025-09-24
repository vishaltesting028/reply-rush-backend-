const User = require('../models/User');
const axios = require('axios');

class InstagramWebhookHandler {
  
  // Handle Instagram comments
  static async handleComments(instagramUserId, changeData) {
    try {
      console.log(`Processing comment for Instagram user ${instagramUserId}:`, changeData);
      
      const { comment_id, media_id, ad_id, ad_title, original_media_id } = changeData;
      
      // Find user by Instagram user ID
      const user = await User.findOne({ 'instagram.userId': instagramUserId });
      
      if (!user || !user.instagram?.accessToken) {
        console.log(`User with Instagram ID ${instagramUserId} not found or no access token`);
        return;
      }

      // Get comment details
      const accessToken = user.instagram?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
      const response = await axios.get(
        `https://graph.instagram.com/${comment_id}?fields=text,timestamp&access_token=${accessToken}`
      );
      const commentDetails = response.data;
      
      if (commentDetails) {
        console.log(`New comment on media ${media_id}:`, commentDetails.text);
        
        // Store comment in database
        await this.storeComment(user, {
          commentId: comment_id,
          mediaId: media_id,
          text: commentDetails.text,
          timestamp: commentDetails.timestamp,
          adId: ad_id,
          adTitle: ad_title,
          originalMediaId: original_media_id
        });
        
        // Auto-respond if configured
        await this.handleAutoResponse(user, commentDetails, media_id);
      }
      
    } catch (error) {
      console.error('Error handling comment:', error);
    }
  }

  // Handle Instagram mentions
  static async handleMentions(instagramUserId, changeData) {
    try {
      console.log(`Processing mention for Instagram user ${instagramUserId}:`, changeData);
      
      const { comment_id, media_id } = changeData;
      
      // Find user by Instagram user ID
      const user = await User.findOne({ 'instagram.userId': instagramUserId });
      
      if (!user || !user.instagram?.accessToken) {
        console.log(`User with Instagram ID ${instagramUserId} not found or no access token`);
        return;
      }

      if (comment_id) {
        // Comment mention
        const accessToken = user.instagram?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
        const response = await axios.get(
          `https://graph.instagram.com/${instagramUserId}?fields=mentioned_comment.comment_id(${comment_id}){text,timestamp}&access_token=${accessToken}`
        );
        const mentionDetails = response.data.mentioned_comment;
        
        if (mentionDetails) {
          console.log(`Mentioned in comment: ${mentionDetails.text}`);
          
          // Store mention
          await this.storeMention(user, {
            type: 'comment',
            commentId: comment_id,
            mediaId: media_id,
            text: mentionDetails.text,
            timestamp: mentionDetails.timestamp
          });
          
          // Auto-respond to mention
          await this.respondToMention(user, comment_id, media_id, 'comment');
        }
      } else if (media_id) {
        // Caption mention
        const accessToken = user.instagram?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
        const response = await axios.get(
          `https://graph.instagram.com/${instagramUserId}?fields=mentioned_media.media_id(${media_id}){caption,media_type}&access_token=${accessToken}`
        );
        const captionDetails = response.data.mentioned_media;
        
        if (captionDetails) {
          console.log(`Mentioned in caption: ${captionDetails.caption}`);
          
          // Store mention
          await this.storeMention(user, {
            type: 'caption',
            mediaId: media_id,
            caption: captionDetails.caption,
            mediaType: captionDetails.media_type
          });
          
          // Auto-respond to mention
          await this.respondToMention(user, null, media_id, 'caption');
        }
      }
      
    } catch (error) {
      console.error('Error handling mention:', error);
    }
  }

  // Handle story insights
  static async handleStoryInsights(instagramUserId, changeData) {
    try {
      console.log(`Processing story insights for Instagram user ${instagramUserId}:`, changeData);
      
      const { media_id, exits, replies, reach, taps_forward, taps_back, impressions } = changeData;
      
      // Find user by Instagram user ID
      const user = await User.findOne({ 'instagram.userId': instagramUserId });
      
      if (!user) {
        console.log(`User with Instagram ID ${instagramUserId} not found`);
        return;
      }

      // Store story insights
      await this.storeStoryInsights(user, {
        mediaId: media_id,
        metrics: {
          exits,
          replies,
          reach,
          tapsForward: taps_forward,
          tapsBack: taps_back,
          impressions
        },
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error handling story insights:', error);
    }
  }

  // Handle photo/media updates from Instagram
  static async handlePhotoUpdate(userId, changeData) {
    try {
      console.log(`Processing photo update for user ${userId}:`, changeData);
      
      const { verb, object_id } = changeData;
      
      // Find user by Instagram user ID
      const user = await User.findOne({ 'instagram.userId': userId });
      
      if (!user) {
        console.log(`User with Instagram ID ${userId} not found in database`);
        return;
      }

      switch (verb) {
        case 'update':
          console.log(`User ${user.username} updated photo/media ${object_id}`);
          // Here you can fetch the updated media and sync with your database
          await this.syncMediaFromInstagram(user, object_id);
          break;
          
        case 'delete':
          console.log(`User ${user.username} deleted photo/media ${object_id}`);
          // Handle media deletion
          await this.handleMediaDeletion(user, object_id);
          break;
          
        default:
          console.log(`Unhandled verb: ${verb} for media ${object_id}`);
      }
      
    } catch (error) {
      console.error('Error handling photo update:', error);
    }
  }

  // Sync specific media from Instagram
  static async syncMediaFromInstagram(user, mediaId) {
    try {
      // Use environment token as fallback if user doesn't have one
      const accessToken = user.instagram?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
      
      if (!accessToken) {
        console.log('No Instagram access token available for user or in environment');
        return;
      }

      // Fetch media details from Instagram
      const response = await axios.get(
        `https://graph.instagram.com/${mediaId}?fields=id,media_type,media_url,permalink,caption,timestamp&access_token=${accessToken}`
      );

      const mediaData = response.data;
      console.log('Fetched media data:', mediaData);

      // Update user's Instagram media in database
      if (!user.instagram.media) {
        user.instagram.media = [];
      }

      // Check if media already exists
      const existingMediaIndex = user.instagram.media.findIndex(
        media => media.id === mediaData.id
      );

      if (existingMediaIndex >= 0) {
        // Update existing media
        user.instagram.media[existingMediaIndex] = {
          id: mediaData.id,
          type: mediaData.media_type,
          url: mediaData.media_url,
          permalink: mediaData.permalink,
          caption: mediaData.caption,
          timestamp: mediaData.timestamp,
          lastUpdated: new Date()
        };
      } else {
        // Add new media
        user.instagram.media.push({
          id: mediaData.id,
          type: mediaData.media_type,
          url: mediaData.media_url,
          permalink: mediaData.permalink,
          caption: mediaData.caption,
          timestamp: mediaData.timestamp,
          lastUpdated: new Date()
        });
      }

      await user.save();
      console.log(`Successfully synced media ${mediaId} for user ${user.username}`);

    } catch (error) {
      console.error('Error syncing media from Instagram:', error.response?.data || error.message);
    }
  }

  // Handle media deletion
  static async handleMediaDeletion(user, mediaId) {
    try {
      if (!user.instagram?.media) {
        return;
      }

      // Remove media from user's stored media
      user.instagram.media = user.instagram.media.filter(
        media => media.id !== mediaId
      );

      await user.save();
      console.log(`Successfully removed deleted media ${mediaId} for user ${user.username}`);

    } catch (error) {
      console.error('Error handling media deletion:', error);
    }
  }

  // Get comment details from Instagram API
  static async getCommentDetails(commentId, accessToken) {
    try {
      const response = await axios.get(
        `https://graph.instagram.com/${commentId}?fields=text,timestamp&access_token=${accessToken}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching comment details:', error.response?.data || error.message);
      return null;
    }
  }

  // Get mention comment details
  static async getMentionCommentDetails(instagramUserId, commentId, accessToken) {
    try {
      const response = await axios.get(
        `https://graph.instagram.com/${instagramUserId}?fields=mentioned_comment.comment_id(${commentId}){text,timestamp}&access_token=${accessToken}`
      );
      return response.data.mentioned_comment;
    } catch (error) {
      console.error('Error fetching mention comment details:', error.response?.data || error.message);
      return null;
    }
  }

  // Get mention caption details
  static async getMentionCaptionDetails(instagramUserId, mediaId, accessToken) {
    try {
      const response = await axios.get(
        `https://graph.instagram.com/${instagramUserId}?fields=mentioned_media.media_id(${mediaId}){caption,media_type}&access_token=${accessToken}`
      );
      return response.data.mentioned_media;
    } catch (error) {
      console.error('Error fetching mention caption details:', error.response?.data || error.message);
      return null;
    }
  }

  // Store comment in database
  static async storeComment(user, commentData) {
    try {
      if (!user.instagram.comments) {
        user.instagram.comments = [];
      }

      user.instagram.comments.push({
        ...commentData,
        receivedAt: new Date()
      });

      await user.save();
      console.log(`Comment stored for user ${user.username}`);
    } catch (error) {
      console.error('Error storing comment:', error);
    }
  }

  // Store mention in database
  static async storeMention(user, mentionData) {
    try {
      if (!user.instagram.mentions) {
        user.instagram.mentions = [];
      }

      user.instagram.mentions.push({
        ...mentionData,
        receivedAt: new Date()
      });

      await user.save();
      console.log(`Mention stored for user ${user.username}`);
    } catch (error) {
      console.error('Error storing mention:', error);
    }
  }

  // Store story insights in database
  static async storeStoryInsights(user, insightsData) {
    try {
      if (!user.instagram.storyInsights) {
        user.instagram.storyInsights = [];
      }

      user.instagram.storyInsights.push(insightsData);

      await user.save();
      console.log(`Story insights stored for user ${user.username}`);
    } catch (error) {
      console.error('Error storing story insights:', error);
    }
  }

  // Handle auto-response to comments
  static async handleAutoResponse(user, commentDetails, mediaId) {
    try {
      // Check if user has auto-response enabled
      if (!user.instagram.autoResponse?.enabled) {
        return;
      }

      const autoResponseMessage = user.instagram.autoResponse.message || "Thanks for your comment!";
      
      // Reply to comment
      const response = await axios.post(
        `https://graph.instagram.com/${mediaId}/comments`,
        {
          message: autoResponseMessage,
          access_token: user.instagram.accessToken
        }
      );

      console.log(`Auto-response sent:`, response.data);
    } catch (error) {
      console.error('Error sending auto-response:', error.response?.data || error.message);
    }
  }

  // Respond to mentions
  static async respondToMention(user, commentId, mediaId, type) {
    try {
      // Check if user has mention response enabled
      if (!user.instagram.mentionResponse?.enabled) {
        return;
      }

      const responseMessage = user.instagram.mentionResponse.message || "Thanks for mentioning us!";
      
      const response = await axios.post(
        `https://graph.instagram.com/${user.instagram.userId}/mentions`,
        {
          comment_id: commentId,
          media_id: mediaId,
          message: responseMessage,
          access_token: user.instagram.accessToken
        }
      );

      console.log(`Mention response sent:`, response.data);
    } catch (error) {
      console.error('Error responding to mention:', error.response?.data || error.message);
    }
  }

  // Process webhook event
  static async processWebhookEvent(webhookData) {
    console.log('Instagram webhook event received:', JSON.stringify(webhookData, null, 2));
    try {
      const { object, entry } = webhookData;
      
      if (object === 'instagram') {
        // Instagram Graph API webhooks
        for (const item of entry) {
          const { changes, id: instagramUserId } = item;
          
          for (const change of changes) {
            const { field, value } = change;
            
            switch (field) {
              case 'comments':
                await this.handleComments(instagramUserId, value);
                break;
                
              case 'live_comments':
                await this.handleComments(instagramUserId, value);
                break;
                
              case 'mentions':
                await this.handleMentions(instagramUserId, value);
                break;
                
              case 'story_insights':
                await this.handleStoryInsights(instagramUserId, value);
                break;
                
              default:
                console.log(`Unhandled Instagram webhook field: ${field}`, value);
            }
          }
        }
      } else if (object === 'user') {
        // Legacy user object webhooks
        for (const item of entry) {
          const { changes, id: userId } = item;
          
          for (const change of changes) {
            const { field, value } = change;
            
            switch (field) {
              case 'photos':
              case 'media':
                await this.handlePhotoUpdate(userId, value);
                break;
                
              default:
                console.log(`Unhandled user webhook field: ${field}`, value);
            }
          }
        }
      } else {
        console.log(`Unhandled webhook object type: ${object}`);
      }
      
    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  }
}

module.exports = InstagramWebhookHandler;
