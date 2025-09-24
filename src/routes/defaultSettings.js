const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Mock data for default settings
let defaultSettings = {
  triggerType: 'keywords',
  keywordTriggers: ['Buy', 'Link', 'Purchase', 'DM'],
  excludeKeywords: ['Bad', 'Horrible', 'Disappointed'],
  templateType: 'media',
  textMessage: 'Automation Powered by @ReplyRushh',
  quickReplies: 'Text Message',
  urlWhenPressed: '',
  buttonTitle: '',
  headline: '',
  textDescription: 'Automation Powered by @ReplyRushh',
  sendOnce: true,
  delayMessage: 5,
  suggestMore: true
};

// Get default settings
router.get('/', protect, (req, res) => {
  try {
    res.json({
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching default settings',
      error: error.message
    });
  }
});

// Update default settings
router.put('/', protect, (req, res) => {
  try {
    const updatedSettings = { ...defaultSettings, ...req.body };
    defaultSettings = updatedSettings;
    
    res.json({
      success: true,
      message: 'Default settings updated successfully',
      data: defaultSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating default settings',
      error: error.message
    });
  }
});

module.exports = router;
