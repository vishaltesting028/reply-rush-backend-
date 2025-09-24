const express = require('express');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get user profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format the response to match frontend expectations
    const profileData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      avatar: user.avatar || '',
      company: user.company || '',
      website: user.website || ''
    };

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/', protect, async (req, res) => {
  try {
    const { name, email, phone, bio, avatar, company, website } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (company !== undefined) user.company = company;
    if (website !== undefined) user.website = website;

    await user.save();

    // Format the response to match frontend expectations
    const profileData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      avatar: user.avatar || '',
      company: user.company || '',
      website: user.website || ''
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

module.exports = router;
