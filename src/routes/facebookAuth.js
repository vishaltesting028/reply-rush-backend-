const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const instagramDataFetcher = require('../services/instagramDataFetcher');

const router = express.Router();

// @desc    Redirect to Facebook for authentication
// @route   GET /auth/facebook
// @access  Public
router.get('/facebook', passport.authenticate('facebook', { 
  scope: ['email', 'public_profile', 'pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish']
}));

// @desc    Facebook OAuth callback
// @route   GET /auth/facebook/callback
// @access  Public
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: process.env.FRONTEND_URL + '?error=facebook_auth_failed',
    session: true
  }),
  async function(req, res) {
    try {
      console.log('Facebook OAuth successful for user:', req.user.facebook.name);
      
      // Check if user has Instagram Business Account access
      const facebookAccessToken = req.user.facebook.accessToken;
      let instagramConnected = false;
      
      if (facebookAccessToken) {
        try {
          // Attempt to get Instagram Business Account
          const axios = require('axios');
          const pagesRes = await axios.get('https://graph.facebook.com/v16.0/me/accounts', {
            params: {
              fields: 'id,name,access_token,instagram_business_account',
              access_token: facebookAccessToken
            }
          });

          // Check for Instagram Business Account
          for (const page of pagesRes.data.data) {
            if (page.instagram_business_account) {
              const instagramAccountId = page.instagram_business_account.id;
              const pageAccessToken = page.access_token;

              // Get Instagram Business Account details
              const instagramRes = await axios.get(`https://graph.facebook.com/v16.0/${instagramAccountId}`, {
                params: {
                  fields: 'id,username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url',
                  access_token: pageAccessToken
                }
              });

              const instagramData = instagramRes.data;

              // Update user's Instagram connection
              req.user.instagram = {
                username: instagramData.username,
                accessToken: pageAccessToken,
                instagramUserId: instagramAccountId,
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
                  id: instagramAccountId,
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
                facebookAccessToken: facebookAccessToken,
                pageAccessToken: pageAccessToken,
                instagramBusinessAccountId: instagramAccountId
              };

              await req.user.save();
              instagramConnected = true;
              
              console.log('Instagram Business Account auto-connected:', instagramData.username);
              
              // Sync Instagram data
              try {
                const syncResult = await instagramDataFetcher.syncInstagramData(req.user._id, pageAccessToken);
                if (syncResult.success) {
                  console.log('✅ Instagram data sync completed during Facebook OAuth');
                }
              } catch (syncError) {
                console.warn('⚠️ Instagram data sync error during Facebook OAuth:', syncError.message);
              }
              
              break; // Use first Instagram Business Account found
            }
          }
        } catch (instagramError) {
          console.log('Could not auto-connect Instagram during Facebook OAuth:', instagramError.response?.data);
        }
      }

      // Successful authentication - redirect to dashboard
      const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('auth', 'success');
      redirectUrl.searchParams.set('provider', 'facebook');
      redirectUrl.searchParams.set('user', req.user.facebook.name);
      
      if (instagramConnected) {
        redirectUrl.searchParams.set('instagram', 'connected');
        redirectUrl.searchParams.set('instagram_username', req.user.instagram.username);
      }

      res.redirect(redirectUrl.toString());
      
    } catch (error) {
      console.error('Error in Facebook OAuth callback:', error);
      res.redirect(process.env.FRONTEND_URL + '?error=callback_processing_failed');
    }
  }
);

// @desc    Get current authenticated user
// @route   GET /auth/user
// @access  Private (requires session)
router.get('/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        facebook: req.user.facebook ? {
          name: req.user.facebook.name,
          picture: req.user.facebook.picture,
          connectedAt: req.user.facebook.connectedAt
        } : null,
        instagram: req.user.instagram?.isConnected ? {
          username: req.user.instagram.username,
          accountType: req.user.instagram.accountType,
          followersCount: req.user.instagram.followersCount,
          mediaCount: req.user.instagram.mediaCount,
          profilePicture: req.user.instagram.profilePictureUrl,
          connectedAt: req.user.instagram.connectedAt
        } : null
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// @desc    Logout user
// @route   POST /auth/logout
// @access  Private
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error logging out'
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error destroying session'
        });
      }
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

// @desc    Check authentication status
// @route   GET /auth/status
// @access  Public
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isAuthenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      hasFacebook: !!req.user.facebook,
      hasInstagram: req.user.instagram?.isConnected || false
    } : null
  });
});

module.exports = router;
