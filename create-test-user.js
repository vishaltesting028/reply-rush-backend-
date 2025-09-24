const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function createTestUser() {
  try {
    console.log('Creating test user...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return;
    }

    // Create test user
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
    console.log('✅ Test user created successfully!');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    console.log('   ID:', testUser._id);

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createTestUser();
