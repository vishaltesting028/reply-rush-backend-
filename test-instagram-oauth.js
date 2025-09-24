const axios = require('axios');

// Test Instagram OAuth flow with new Business API setup
async function testInstagramOAuth() {
  const baseURL = 'http://localhost:5000'; // Change this to your ngrok URL when testing
  
  console.log('🧪 Testing Instagram Business OAuth Flow...\n');
  
  try {
    // Step 1: Get Instagram auth URL
    console.log('1️⃣ Getting Instagram Business authorization URL...');
    const authResponse = await axios.get(`${baseURL}/api/instagram/auth`);
    
    if (authResponse.data.success) {
      console.log('✅ Auth URL generated successfully');
      console.log('🔗 Auth URL:', authResponse.data.data.authUrl);
      console.log('\n📝 Expected URL format:');
      console.log('- Should start with: https://www.instagram.com/accounts/login/');
      console.log('- Should include client_id: 1517180355553139');
      console.log('- Should include business scopes');
      console.log('- Should redirect to: https://app.replyrush.com/auth/sign-in/\n');
      
      // Verify URL contains expected components
      const url = authResponse.data.data.authUrl;
      const checks = [
        { name: 'Login URL', test: url.includes('instagram.com/accounts/login') },
        { name: 'Client ID', test: url.includes('1517180355553139') },
        { name: 'Business Scopes', test: url.includes('instagram_business_basic') },
        { name: 'Redirect URI', test: url.includes('app.replyrush.com') }
      ];
      
      console.log('🔍 URL Validation:');
      checks.forEach(check => {
        console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
      });
      console.log();
    } else {
      console.log('❌ Failed to get auth URL:', authResponse.data.message);
    }
    
    // Step 2: Check Instagram status
    console.log('2️⃣ Checking Instagram connection status...');
    const statusResponse = await axios.get(`${baseURL}/api/instagram/status`);
    
    if (statusResponse.data.success) {
      console.log('✅ Status check successful');
      console.log('📊 Connection status:', statusResponse.data.data);
    } else {
      console.log('❌ Status check failed:', statusResponse.data.message);
    }
    
    console.log('\n📋 Manual Testing Steps:');
    console.log('1. Start your backend server');
    console.log('2. Open your frontend application');
    console.log('3. Click the "Connect Instagram" button');
    console.log('4. Verify the popup opens with the correct Instagram login URL');
    console.log('5. Complete Instagram OAuth flow');
    console.log('6. Check if the connection is successful');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
if (require.main === module) {
  testInstagramOAuth();
}

module.exports = { testInstagramOAuth };
