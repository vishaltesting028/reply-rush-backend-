const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Mock data for suggest more settings
let suggestMoreSettings = {
  enabled: true,
  products: [
    {
      id: 1,
      image: '/api/placeholder/150/200',
      title: 'Stylish Outfit',
      description: 'Perfect for casual wear'
    },
    {
      id: 2,
      image: '/api/placeholder/150/200',
      title: 'Fashion Accessory',
      description: 'Complete your look'
    },
    {
      id: 3,
      image: '/api/placeholder/150/200',
      title: 'Trendy Wear',
      description: 'Latest fashion trends'
    },
    {
      id: 4,
      image: '/api/placeholder/150/200',
      title: 'Designer Item',
      description: 'Premium quality'
    }
  ],
  notes: 'The "Suggest More" feature lets you auto-send predefined templates, offering users extra product recommendations or information with a simple tap.'
};

// Get suggest more settings
router.get('/', protect, (req, res) => {
  try {
    res.json({
      success: true,
      data: suggestMoreSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching suggest more settings',
      error: error.message
    });
  }
});

// Update suggest more settings
router.put('/', protect, (req, res) => {
  try {
    const updatedSettings = { ...suggestMoreSettings, ...req.body };
    suggestMoreSettings = updatedSettings;
    
    res.json({
      success: true,
      message: 'Suggest more settings updated successfully',
      data: suggestMoreSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating suggest more settings',
      error: error.message
    });
  }
});

module.exports = router;
