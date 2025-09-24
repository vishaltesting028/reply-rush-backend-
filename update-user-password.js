const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function updateUserPassword() {
  try {
    console.log('Updating password for itachipatel46@gmail.com...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find and update user password
    const user = await User.findOne({ email: 'itachipatel46@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Update password
    user.password = 'password123';
    await user.save();

    console.log('✅ Password updated successfully!');
    console.log('   Email: itachipatel46@gmail.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error updating password:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

updateUserPassword();
