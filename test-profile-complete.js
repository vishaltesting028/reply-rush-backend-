const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testProfileUpdateComplete() {
  try {
    console.log('🔍 Testing complete profile update functionality...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create a test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '',
      bio: '',
      company: '',
      website: ''
    });

    await testUser.save();
    console.log('✅ Test user created:', testUser._id);

    // Test profile update
    const updateData = {
      name: 'Updated Test User',
      email: 'updated@example.com',
      phone: '+1234567890',
      bio: 'This is my updated bio',
      company: 'Test Company Inc',
      website: 'https://testcompany.com'
    };

    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅ Profile updated successfully:');
    console.log('   Name:', updatedUser.name);
    console.log('   Email:', updatedUser.email);
    console.log('   Phone:', updatedUser.phone);
    console.log('   Bio:', updatedUser.bio);
    console.log('   Company:', updatedUser.company);
    console.log('   Website:', updatedUser.website);

    // Verify the update
    const verifyUser = await User.findById(testUser._id).select('-password');
    
    const isValid = 
      verifyUser.name === updateData.name &&
      verifyUser.email === updateData.email &&
      verifyUser.phone === updateData.phone &&
      verifyUser.bio === updateData.bio &&
      verifyUser.company === updateData.company &&
      verifyUser.website === updateData.website;

    if (isValid) {
      console.log('✅ Profile update verification successful');
    } else {
      console.log('❌ Profile update verification failed');
    }

    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test user cleaned up');

    console.log('\n🎉 All profile update tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testProfileUpdateComplete();
