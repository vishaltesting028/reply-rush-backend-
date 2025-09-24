/**
 * Instagram Platform App Error Diagnostic Tool
 * This script helps diagnose and fix the "Invalid platform app" error
 * 
 * Usage: node diagnose-instagram-issue.js
 */

require('dotenv').config();

async function diagnoseInstagramIssue() {
  console.log('🔍 Instagram Platform App Error Diagnostic Tool');
  console.log('==============================================\n');

  // Step 1: Check Environment Variables
  console.log('📋 Step 1: Environment Variables Check');
  console.log('-------------------------------------');
  
  const igAccessToken = process.env.IG_ACCESS_TOKEN;
  const igUserId = process.env.IG_USER_ID;
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  
  console.log(`IG_ACCESS_TOKEN: ${igAccessToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`IG_USER_ID: ${igUserId ? '✅ Set' : '❌ Missing'}`);
  console.log(`INSTAGRAM_ACCESS_TOKEN (legacy): ${instagramAccessToken ? '⚠️  Set (consider using IG_ACCESS_TOKEN instead)' : '❌ Missing'}`);
  
  if (!igAccessToken && !instagramAccessToken) {
    console.log('\n❌ No access token found. Please set IG_ACCESS_TOKEN in your .env file.');
    return;
  }

  const tokenToUse = igAccessToken || instagramAccessToken;
  const userIdToUse = igUserId;

  // Step 2: Analyze Token Format
  console.log('\n🔑 Step 2: Token Analysis');
  console.log('------------------------');
  
  if (tokenToUse.startsWith('EAA')) {
    console.log('✅ Token format looks correct (Facebook/Instagram token)');
  } else {
    console.log('⚠️  Token format unusual - should start with "EAA"');
  }
  
  console.log(`Token length: ${tokenToUse.length} characters`);
  console.log(`Token preview: ${tokenToUse.substring(0, 20)}...`);

  // Step 3: Test Token with Facebook Graph API
  console.log('\n🧪 Step 3: Token Validation Tests');
  console.log('--------------------------------');

  try {
    // Test 1: Check token info
    console.log('Test 1: Checking token information...');
    const tokenInfoUrl = `https://graph.facebook.com/me?access_token=${tokenToUse}`;
    const tokenResponse = await fetch(tokenInfoUrl);
    const tokenData = await tokenResponse.json();
    
    if (tokenResponse.ok) {
      console.log('✅ Token is valid for Facebook Graph API');
      console.log(`   User/Page ID: ${tokenData.id}`);
      console.log(`   Name: ${tokenData.name || 'N/A'}`);
    } else {
      console.log('❌ Token validation failed:');
      console.log(`   Error: ${tokenData.error?.message || 'Unknown error'}`);
      console.log(`   Code: ${tokenData.error?.code || 'N/A'}`);
      console.log(`   Type: ${tokenData.error?.type || 'N/A'}`);
    }

    // Test 2: Check if it's a page token
    console.log('\nTest 2: Checking if token is for a Facebook Page...');
    const pageCheckUrl = `https://graph.facebook.com/${tokenData.id}?fields=instagram_business_account&access_token=${tokenToUse}`;
    const pageResponse = await fetch(pageCheckUrl);
    const pageData = await pageResponse.json();
    
    if (pageResponse.ok && pageData.instagram_business_account) {
      console.log('✅ Token is for a Facebook Page with Instagram Business Account');
      console.log(`   Instagram Business Account ID: ${pageData.instagram_business_account.id}`);
      console.log('   This is the correct setup for Instagram Graph API!');
      
      if (!userIdToUse) {
        console.log(`\n💡 Suggestion: Set IG_USER_ID=${pageData.instagram_business_account.id} in your .env file`);
      }
    } else {
      console.log('⚠️  Token is not for a Facebook Page with Instagram Business Account');
      console.log('   This might be why you\'re getting "Invalid platform app" error');
    }

    // Test 3: Try Instagram Graph API call
    console.log('\nTest 3: Testing Instagram Graph API call...');
    const testUserId = userIdToUse || pageData.instagram_business_account?.id;
    
    if (testUserId) {
      const instagramUrl = `https://graph.instagram.com/${testUserId}?fields=id,username&access_token=${tokenToUse}`;
      const instagramResponse = await fetch(instagramUrl);
      const instagramData = await instagramResponse.json();
      
      if (instagramResponse.ok) {
        console.log('✅ Instagram Graph API call successful!');
        console.log(`   Instagram User ID: ${instagramData.id}`);
        console.log(`   Username: ${instagramData.username}`);
        console.log('\n🎉 Your setup is working correctly!');
      } else {
        console.log('❌ Instagram Graph API call failed:');
        console.log(`   Error: ${instagramData.error?.message || 'Unknown error'}`);
        console.log(`   Code: ${instagramData.error?.code || 'N/A'}`);
        console.log(`   Type: ${instagramData.error?.type || 'N/A'}`);
        
        if (instagramData.error?.message?.includes('Invalid platform app')) {
          console.log('\n🔧 SOLUTION STEPS:');
          console.log('1. Go to https://developers.facebook.com/');
          console.log('2. Select your app');
          console.log('3. Ensure app type is "Business" (not Consumer)');
          console.log('4. Add "Instagram Graph API" product');
          console.log('5. Get a Page Access Token (not User Access Token)');
          console.log('6. Ensure your Instagram account is a Business account');
          console.log('7. Connect Instagram Business account to a Facebook Page');
        }
      }
    } else {
      console.log('❌ No Instagram User ID available for testing');
    }

  } catch (error) {
    console.log(`❌ Network error during testing: ${error.message}`);
  }

  // Step 4: Recommendations
  console.log('\n📝 Step 4: Recommendations');
  console.log('-------------------------');
  
  console.log('For Instagram Graph API, you need:');
  console.log('✓ Facebook Business App (not Consumer app)');
  console.log('✓ Instagram Graph API product added to your app');
  console.log('✓ Instagram Business Account (not personal account)');
  console.log('✓ Instagram Business Account connected to Facebook Page');
  console.log('✓ Page Access Token (not User Access Token)');
  console.log('✓ Proper permissions: instagram_basic, pages_show_list');
  
  console.log('\n📚 Helpful Resources:');
  console.log('• Instagram Graph API Setup: https://developers.facebook.com/docs/instagram-api/getting-started');
  console.log('• Convert to Business Account: https://help.instagram.com/502981923235522');
  console.log('• Connect to Facebook Page: https://www.facebook.com/business/help/898752960195806');
  
  console.log('\n🔧 Quick Fix:');
  console.log('If you have a Facebook Page with Instagram Business Account:');
  console.log('1. Go to Graph API Explorer');
  console.log('2. Select your Facebook Page');
  console.log('3. Generate Page Access Token');
  console.log('4. Get Instagram Business Account ID from the page');
  console.log('5. Use Page Access Token as IG_ACCESS_TOKEN');
  console.log('6. Use Instagram Business Account ID as IG_USER_ID');
}

// Run diagnostic if this file is executed directly
if (require.main === module) {
  diagnoseInstagramIssue().catch(error => {
    console.error('❌ Diagnostic script error:', error);
    process.exit(1);
  });
}

module.exports = { diagnoseInstagramIssue };
