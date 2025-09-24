const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const instagramDataFetcher = require('../services/instagramDataFetcher');

const router = express.Router();

// @desc    Exchange code for access token (Facebook Graph API approach)
// @route   GET /auth/instagram/callback
// @access  Public
const instagramGraphCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const appId = process.env.INSTAGRAM_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    const appSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    if (!appId || !redirectUri || !appSecret) {
      return res.status(500).json({
        success: false,
        message: 'Instagram/Facebook app configuration is incomplete'
      });
    }

    // Exchange code for a user access token (via Facebook Graph)
    const tokenRes = await axios.get('https://graph.facebook.com/v16.0/oauth/access_token', {
      params: {
        client_id: appId,
        redirect_uri: redirectUri,
        client_secret: appSecret,
        code
      }
    });

    // tokenRes.data.access_token contains short-lived token
    const shortLivedToken = tokenRes.data.access_token;
    console.log('Short-lived token obtained successfully');

    // Exchange for long-lived token if needed
    let longLivedToken = shortLivedToken;
    try {
      const longLivedRes = await axios.get('https://graph.facebook.com/v16.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken
        }
      });
      longLivedToken = longLivedRes.data.access_token;
      console.log('Long-lived token obtained successfully');
    } catch (error) {
      console.log('Could not exchange for long-lived token:', error.response?.data);
    }

    // Get user's Facebook pages to find Instagram Business Account
    let instagramData = null;
    let pageAccessToken = null;

    try {
      // Get user's Facebook pages
      const pagesRes = await axios.get('https://graph.facebook.com/v16.0/me/accounts', {
        params: {
          fields: 'id,name,access_token,instagram_business_account',
          access_token: longLivedToken
        }
      });

      // Find page with Instagram Business Account
      for (const page of pagesRes.data.data) {
        if (page.instagram_business_account) {
          const instagramAccountId = page.instagram_business_account.id;
          pageAccessToken = page.access_token;

          // Get Instagram Business Account details
          const instagramRes = await axios.get(`https://graph.facebook.com/v16.0/${instagramAccountId}`, {
            params: {
              fields: 'id,username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url',
              access_token: pageAccessToken
            }
          });

          instagramData = {
            ...instagramRes.data,
            instagramBusinessAccountId: instagramAccountId,
            pageAccessToken: pageAccessToken,
            facebookAccessToken: longLivedToken
          };
          break;
        }
      }
    } catch (error) {
      console.log('Could not fetch Instagram Business Account:', error.response?.data);
    }

    // Find or create user and save Instagram connection
    let user = await User.findOne();
    if (!user) {
      user = new User({ 
        email: 'instagram@user.com', 
        name: 'Instagram User',
        password: 'defaultpassword123'
      });
    }

    if (instagramData) {
      // Save Instagram Business Account data
      user.instagram = {
        username: instagramData.username,
        accessToken: instagramData.pageAccessToken,
        instagramUserId: instagramData.instagramBusinessAccountId,
        accountType: 'BUSINESS',
        mediaCount: instagramData.media_count || 0,
        followersCount: instagramData.followers_count || 0,
        followingCount: instagramData.follows_count || 0,
        biography: instagramData.biography || null,
        website: instagramData.website || null,
        profilePictureUrl: instagramData.profile_picture_url || null,
        isConnected: true,
        connectedAt: new Date(),
        lastSyncAt: new Date(),
        profile: {
          id: instagramData.instagramBusinessAccountId,
          username: instagramData.username,
          name: instagramData.name || instagramData.username,
          accountType: 'BUSINESS',
          mediaCount: instagramData.media_count || 0,
          followersCount: instagramData.followers_count || 0,
          followingCount: instagramData.follows_count || 0,
          biography: instagramData.biography || null,
          website: instagramData.website || null,
          profilePictureUrl: instagramData.profile_picture_url || null,
          lastUpdated: new Date()
        },
        facebookAccessToken: instagramData.facebookAccessToken,
        pageAccessToken: instagramData.pageAccessToken,
        instagramBusinessAccountId: instagramData.instagramBusinessAccountId
      };

      await user.save();
      console.log('Instagram Business Account connected successfully:', instagramData.username);

      // Sync Instagram data
      try {
        const syncResult = await instagramDataFetcher.syncInstagramData(user._id, instagramData.pageAccessToken);
        if (syncResult.success) {
          console.log('✅ Instagram data sync completed');
        }
      } catch (syncError) {
        console.warn('⚠️ Instagram data sync error:', syncError.message);
      }

      res.json({
        success: true,
        message: 'Instagram Business Account connected successfully',
        data: {
          username: instagramData.username,
          accountType: 'BUSINESS',
          isConnected: true,
          connectedAt: user.instagram.connectedAt,
          profilePicture: instagramData.profile_picture_url,
          followersCount: instagramData.followers_count,
          mediaCount: instagramData.media_count,
          website: instagramData.website,
          biography: instagramData.biography
        }
      });
    } else {
      // No Instagram Business Account found, save basic Facebook data
      const userRes = await axios.get('https://graph.facebook.com/v16.0/me', {
        params: {
          fields: 'id,name',
          access_token: longLivedToken
        }
      });

      user.instagram = {
        username: `facebook_${userRes.data.id}`,
        accessToken: longLivedToken,
        instagramUserId: userRes.data.id,
        accountType: 'PERSONAL',
        isConnected: true,
        connectedAt: new Date(),
        lastSyncAt: new Date(),
        facebookAccessToken: longLivedToken
      };

      await user.save();

      res.json({
        success: true,
        message: 'Facebook account connected (no Instagram Business Account found)',
        data: {
          username: user.instagram.username,
          accountType: 'PERSONAL',
          isConnected: true,
          connectedAt: user.instagram.connectedAt,
          note: 'To access Instagram features, please connect an Instagram Business Account to your Facebook Page'
        }
      });
    }

  } catch (error) {
    console.error('Instagram Graph OAuth error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Instagram account',
      error: error.response?.data?.error?.message || error.message
    });
  }
};

// Route handler
router.get('/callback', instagramGraphCallback);

module.exports = router;
