const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Mock data for engagement starter settings
let engagementSettings = {
  enabled: true,
  autoEnableNewPosts: true,
  enableAlreadyLiked: false,
  message: "Hi there! I'm thrilled to have you here—thank you for your interest! 😊 Tap the button below, and I'll send over the link right away 👇",
  buttonTitle: "Send Link Now",
  notes: "This feature automatically sends an introductory message or DM to users who have never interacted before. It initiates engagement by sending a first-time message, starting the conversation with those users."
};

// Get engagement starter settings
router.get('/', protect, (req, res) => {
  try {
    res.json({
      success: true,
      data: engagementSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching engagement starter settings',
      error: error.message
    });
  }
});

// Update engagement starter settings
router.put('/', protect, (req, res) => {
  try {
    const updatedSettings = { ...engagementSettings, ...req.body };
    engagementSettings = updatedSettings;
    
    res.json({
      success: true,
      message: 'Engagement starter settings updated successfully',
      data: engagementSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating engagement starter settings',
      error: error.message
    });
  }
});

module.exports = router;
