const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function createUserWithEmail() {
  try {
    console.log('Creating user with itachipatel46@gmail.com...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'itachipatel46@gmail.com' });
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email);
      return;
    }

    // Create user
    const user = new User({
      name: 'Itachi Patel',
      email: 'itachipatel46@gmail.com',
      password: 'password123',
      phone: '',
      bio: '',
      company: '',
      website: ''
    });

    await user.save();
    console.log('✅ User created successfully!');
    console.log('   Email: itachipatel46@gmail.com');
    console.log('   Password: password123');
    console.log('   ID:', user._id);

  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createUserWithEmail();
