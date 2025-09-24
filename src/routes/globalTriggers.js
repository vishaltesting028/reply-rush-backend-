const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Mock data for global triggers
let globalTriggers = [
  {
    id: 1,
    name: 'Fashion Engagement Flow',
    type: 'Story',
    open: 15,
    sent: 8,
    click: 5,
    action: 'Active',
    createdAt: new Date('2024-01-15'),
    triggers: ['Link', 'Buy', 'Purchase'],
    excludeKeywords: ['Bad', 'Horrible'],
    template: {
      type: 'media',
      headline: 'Fashion Collection',
      description: 'Check out our latest fashion items',
      buttonTitle: 'Shop Now',
      url: 'https://example.com/shop'
    }
  }
];

// Get all global triggers
router.get('/', protect, (req, res) => {
  try {
    res.json({
      success: true,
      data: globalTriggers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching global triggers',
      error: error.message
    });
  }
});

// Get single global trigger
router.get('/:id', protect, (req, res) => {
  try {
    const trigger = globalTriggers.find(t => t.id === parseInt(req.params.id));
    if (!trigger) {
      return res.status(404).json({
        success: false,
        message: 'Global trigger not found'
      });
    }
    
    res.json({
      success: true,
      data: trigger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching global trigger',
      error: error.message
    });
  }
});

// Create new global trigger
router.post('/', protect, (req, res) => {
  try {
    const newTrigger = {
      id: globalTriggers.length + 1,
      ...req.body,
      createdAt: new Date(),
      open: 0,
      sent: 0,
      click: 0,
      action: 'Active'
    };
    
    globalTriggers.push(newTrigger);
    
    res.status(201).json({
      success: true,
      message: 'Global trigger created successfully',
      data: newTrigger
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating global trigger',
      error: error.message
    });
  }
});

// Update global trigger
router.put('/:id', protect, (req, res) => {
  try {
    const triggerIndex = globalTriggers.findIndex(t => t.id === parseInt(req.params.id));
    if (triggerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Global trigger not found'
      });
    }
    
    globalTriggers[triggerIndex] = { ...globalTriggers[triggerIndex], ...req.body };
    
    res.json({
      success: true,
      message: 'Global trigger updated successfully',
      data: globalTriggers[triggerIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating global trigger',
      error: error.message
    });
  }
});

// Delete global trigger
router.delete('/:id', protect, (req, res) => {
  try {
    const triggerIndex = globalTriggers.findIndex(t => t.id === parseInt(req.params.id));
    if (triggerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Global trigger not found'
      });
    }
    
    globalTriggers.splice(triggerIndex, 1);
    
    res.json({
      success: true,
      message: 'Global trigger deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting global trigger',
      error: error.message
    });
  }
});

module.exports = router;
