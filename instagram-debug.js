// Instagram OAuth Debug Script
// Run this to test your Instagram app configuration

require('dotenv').config();

console.log('=== Instagram App Configuration Debug ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('INSTAGRAM_CLIENT_ID:', process.env.INSTAGRAM_CLIENT_ID ? `${process.env.INSTAGRAM_CLIENT_ID.substring(0, 10)}...` : 'NOT SET');
console.log('INSTAGRAM_CLIENT_SECRET:', process.env.INSTAGRAM_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('INSTAGRAM_REDIRECT_URI:', process.env.INSTAGRAM_REDIRECT_URI || 'NOT SET');

// Generate test OAuth URL
if (process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_REDIRECT_URI) {
  const testAuthUrl = `https://api.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}&scope=user_profile,user_media&response_type=code&state=${Date.now()}`;
  
  console.log('\nGenerated OAuth URL:');
  console.log(testAuthUrl);
  
  console.log('\n=== CRITICAL: Instagram App Requirements ===');
  console.log('❗ App Type: Must be "Instagram Basic Display" (NOT Instagram Graph API)');
  console.log('❗ App Status: Must be "Live" mode for production users');
  console.log('❗ Valid OAuth Redirect URIs must include:', process.env.INSTAGRAM_REDIRECT_URI);
  console.log('❗ Instagram Basic Display product must be added to your app');
  console.log('❗ If in Development mode, your Instagram account must be added as Test User');
  
  console.log('\n=== Steps to Fix "Invalid platform app" ===');
  console.log('1. Go to developers.facebook.com');
  console.log('2. Select your app');
  console.log('3. Check App Type is "Instagram Basic Display"');
  console.log('4. Add Instagram Basic Display product if missing');
  console.log('5. Add your redirect URI to Valid OAuth Redirect URIs');
  console.log('6. Switch to Live mode OR add test users in Development');
  
} else {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please set INSTAGRAM_CLIENT_ID and INSTAGRAM_REDIRECT_URI in your .env file');
}

console.log('\n=== Error Meanings ===');
console.log('- "Invalid platform app" = Wrong app type, missing product, or wrong Client ID');
console.log('- "Invalid redirect URI" = URI not whitelisted in app dashboard');
console.log('- "App not approved" = Need Instagram Basic Display permissions approved');
console.log('- "Invalid user" = User not added as test user in Development mode');

console.log('\n=== Quick Fix ===');
console.log('Most likely cause: Your app is NOT "Instagram Basic Display" type');
console.log('Create a new app with type "Instagram Basic Display" and use that Client ID');
