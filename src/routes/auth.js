const express = require('express');
const { register, login, getMe, changePassword, deleteAccount, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Instagram webhook verification endpoint
// @route   GET /api/auth/instagram/callback
// @access  Public
const instagramWebhookCallback = (req, res) => {
  const VERIFY_TOKEN = "IGAG5YUDLCEV9BZAE5EjVKMHlmVnFSRjA3NjNYaF9VQTNiVEdzbTZA6TW02b0w5b3ZAkb0hkTDNpQnB1T2ozNTd3MWVTYmQzdjYT3Z"; // SAME token as dashboard

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log('Instagram webhook verification:', { 
    mode, 
    token: token ? `${token.substring(0, 15)}...` : 'Missing',
    challenge
  });

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook Verified!");
      res.status(200).send(challenge);
    } else {
      console.log("Webhook verification failed ❌");
      res.sendStatus(403);
    }
  } else {
    console.log("Missing required parameters ❌");
    res.sendStatus(400);
  }
};

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

// Instagram webhook verification endpoint
router.get('/instagram/callback', instagramWebhookCallback);

module.exports = router;
