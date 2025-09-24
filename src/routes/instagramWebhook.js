const express = require('express');
const crypto = require('crypto');
const InstagramWebhookHandler = require('../services/webhookHandler');

const router = express.Router();

// @desc    Verify Instagram Webhook (GET request)
// @route   GET /webhook/instagram
// @access  Public
const verifyWebhook = (req, res) => {
  // Set headers to prevent caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || "my_secret_token";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log('Instagram webhook verification request:', { 
    mode, 
    token: token ? `${token.substring(0, 10)}...` : 'Missing',
    challenge,
    expectedToken: VERIFY_TOKEN ? `${VERIFY_TOKEN.substring(0, 10)}...` : 'Missing'
  });

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Instagram webhook verified successfully!');
      return res.status(200).send(challenge); // verification success
    } else {
      console.log('❌ Instagram webhook verification failed - token mismatch');
      console.log('Expected:', VERIFY_TOKEN ? `${VERIFY_TOKEN.substring(0, 10)}...` : 'Missing');
      console.log('Received:', token ? `${token.substring(0, 10)}...` : 'Missing');
      return res.sendStatus(403);
    }
  } else {
    console.log('❌ Instagram webhook verification failed - missing parameters');
    return res.status(400).json({
      error: 'Missing required parameters',
      received: { mode, token: !!token, challenge: !!challenge }
    });
  }
};

// @desc    Receive Instagram Webhook Events (POST request)
// @route   POST /webhook/instagram
// @access  Public
const receiveWebhookEvent = async (req, res) => {
  try {
    // Set headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    console.log('📥 Instagram webhook event received:', JSON.stringify(req.body, null, 2));
    console.log('📋 Request headers:', {
      'x-hub-signature-256': req.headers['x-hub-signature-256'],
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    });

    // Verify webhook signature if app secret is configured
    const signature = req.headers['x-hub-signature-256'];
    
    if (signature && process.env.INSTAGRAM_CLIENT_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.INSTAGRAM_CLIENT_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      const fullExpectedSignature = `sha256=${expectedSignature}`;
      
      if (signature !== fullExpectedSignature) {
        console.log('❌ Instagram webhook signature validation failed');
        console.log('Expected signature:', fullExpectedSignature.substring(0, 20) + '...');
        console.log('Received signature:', signature.substring(0, 20) + '...');
        return res.status(403).json({
          error: 'Invalid signature',
          message: 'Webhook signature validation failed'
        });
      }
      
      console.log('✅ Instagram webhook signature validated successfully');
    } else {
      console.log('⚠️ Instagram webhook signature validation skipped (no app secret configured)');
    }

    // Process the webhook event using the existing handler service
    await InstagramWebhookHandler.processWebhookEvent(req.body);

    // Log successful processing
    console.log('✅ Instagram webhook event processed successfully');
    
    // Send success response
    res.status(200).json({ 
      success: true, 
      message: 'Webhook event processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing Instagram webhook event:', error);
    
    // Send error response but still return 200 to prevent Instagram from retrying
    res.status(200).json({ 
      success: false, 
      message: 'Error processing webhook event',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// @desc    Test webhook endpoint (for development)
// @route   POST /webhook/instagram/test
// @access  Public
const testWebhook = async (req, res) => {
  try {
    console.log('🧪 Test webhook event received:', JSON.stringify(req.body, null, 2));
    
    // Create a test webhook payload
    const testPayload = req.body || {
      object: 'instagram',
      entry: [{
        id: 'test_instagram_user_id',
        changes: [{
          field: 'comments',
          value: {
            comment_id: 'test_comment_id',
            media_id: 'test_media_id',
            text: 'This is a test comment from webhook'
          }
        }]
      }]
    };

    // Process the test event
    await InstagramWebhookHandler.processWebhookEvent(testPayload);
    
    res.json({
      success: true,
      message: 'Test webhook processed successfully',
      payload: testPayload,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing test webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing test webhook',
      error: error.message
    });
  }
};

// @desc    Get webhook configuration info
// @route   GET /webhook/instagram/info
// @access  Public
const getWebhookInfo = (req, res) => {
  res.json({
    success: true,
    webhook: {
      verifyToken: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ? 'Configured' : 'Missing',
      appSecret: process.env.INSTAGRAM_CLIENT_SECRET ? 'Configured' : 'Missing',
      endpoints: {
        verify: '/webhook/instagram (GET)',
        receive: '/webhook/instagram (POST)',
        test: '/webhook/instagram/test (POST)',
        info: '/webhook/instagram/info (GET)'
      },
      supportedEvents: [
        'comments',
        'live_comments', 
        'mentions',
        'story_insights',
        'photos',
        'media'
      ],
      instructions: {
        facebookDeveloper: 'Configure webhook URL in Facebook Developer Console',
        verifyToken: 'Set INSTAGRAM_WEBHOOK_VERIFY_TOKEN in environment',
        appSecret: 'Set INSTAGRAM_CLIENT_SECRET for signature verification'
      }
    },
    timestamp: new Date().toISOString()
  });
};

// Route handlers
router.get('/', verifyWebhook);
router.post('/', receiveWebhookEvent);
router.post('/test', testWebhook);
router.get('/info', getWebhookInfo);

module.exports = router;
