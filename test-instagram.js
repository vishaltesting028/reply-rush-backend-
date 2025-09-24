require('dotenv').config();
const axios = require('axios');

async function testInstagramAPI() {
  console.log('🔍 Testing Instagram API with current .env configuration...\n');
  
  console.log('Environment Variables:');
  console.log('INSTAGRAM_CLIENT_ID:', process.env.INSTAGRAM_CLIENT_ID ? `${process.env.INSTAGRAM_CLIENT_ID.substring(0, 8)}...` : 'Missing');
  console.log('INSTAGRAM_CLIENT_SECRET:', process.env.INSTAGRAM_CLIENT_SECRET ? 'Set' : 'Missing');
  console.log('INSTAGRAM_ACCESS_TOKEN:', process.env.INSTAGRAM_ACCESS_TOKEN ? `${process.env.INSTAGRAM_ACCESS_TOKEN.substring(0, 20)}...` : 'Missing');
  console.log('INSTAGRAM_REDIRECT_URI:', process.env.INSTAGRAM_REDIRECT_URI);
  
  // Test OAuth URL generation
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}&scope=user_profile,user_media&response_type=code&state=${Date.now()}`;
  console.log('\n📝 Generated OAuth URL:', authUrl);
  
  // Test API access with token
  try {
    console.log('\n🔍 Testing Instagram Graph API...');
    const response = await axios.get(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`
    );
    
    console.log('✅ Instagram API connection successful!');
    console.log('📊 Profile data:', response.data);
    
  } catch (error) {
    console.log('❌ Instagram API test failed:');
    console.log('Error:', error.response?.data || error.message);
    
    if (error.response?.data?.error?.code === 190) {
      console.log('\n🔧 Token Issue: Access token is invalid or expired');
      console.log('📝 Solution: Create a new Instagram app at https://developers.facebook.com/apps/');
    }
  }
}

testInstagramAPI();
