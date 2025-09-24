const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Mock data for welcome openers
let welcomeOpeners = [
  {
    id: 1,
    question: 'Fashion Welcome Flow',
    type: 'DM',
    open: 25,
    sent: 18,
    click: 12,
    action: 'Active',
    createdAt: new Date('2024-01-10'),
    message: 'Welcome! Check out our latest fashion collection',
    template: {
      type: 'media',
      headline: 'Welcome to Fashion Store',
      description: 'Discover amazing fashion items',
      buttonTitle: 'Shop Now',
      url: 'https://example.com/shop'
    }
  }
];

// Get all welcome openers
router.get('/', protect, (req, res) => {
  try {
    res.json({
      success: true,
      data: welcomeOpeners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching welcome openers',
      error: error.message
    });
  }
});

// Get single welcome opener
router.get('/:id', protect, (req, res) => {
  try {
    const opener = welcomeOpeners.find(o => o.id === parseInt(req.params.id));
    if (!opener) {
      return res.status(404).json({
        success: false,
        message: 'Welcome opener not found'
      });
    }
    
    res.json({
      success: true,
      data: opener
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching welcome opener',
      error: error.message
    });
  }
});

// Create new welcome opener
router.post('/', protect, (req, res) => {
  try {
    const newOpener = {
      id: welcomeOpeners.length + 1,
      ...req.body,
      createdAt: new Date(),
      open: 0,
      sent: 0,
      click: 0,
      action: 'Active'
    };
    
    welcomeOpeners.push(newOpener);
    
    res.status(201).json({
      success: true,
      message: 'Welcome opener created successfully',
      data: newOpener
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating welcome opener',
      error: error.message
    });
  }
});

// Update welcome opener
router.put('/:id', protect, (req, res) => {
  try {
    const openerIndex = welcomeOpeners.findIndex(o => o.id === parseInt(req.params.id));
    if (openerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Welcome opener not found'
      });
    }
    
    welcomeOpeners[openerIndex] = { ...welcomeOpeners[openerIndex], ...req.body };
    
    res.json({
      success: true,
      message: 'Welcome opener updated successfully',
      data: welcomeOpeners[openerIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating welcome opener',
      error: error.message
    });
  }
});

// Delete welcome opener
router.delete('/:id', protect, (req, res) => {
  try {
    const openerIndex = welcomeOpeners.findIndex(o => o.id === parseInt(req.params.id));
    if (openerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Welcome opener not found'
      });
    }
    
    welcomeOpeners.splice(openerIndex, 1);
    
    res.json({
      success: true,
      message: 'Welcome opener deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting welcome opener',
      error: error.message
    });
  }
});

module.exports = router;
