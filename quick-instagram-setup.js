const fs = require('fs');

// Create a working Instagram app configuration
console.log('🚀 Setting up Instagram App for ReplyRush...\n');

// Step 1: Open Facebook Developers
console.log('📱 Step 1: Create Instagram App');
console.log('1. Go to: https://developers.facebook.com/apps/');
console.log('2. Click "Create App" → Select "Consumer"');
console.log('3. App Name: "ReplyRush Instagram"');
console.log('4. Contact Email: your email\n');

// Step 2: Add Instagram Basic Display
console.log('📸 Step 2: Add Instagram Basic Display');
console.log('1. In app dashboard → "Add Product"');
console.log('2. Find "Instagram Basic Display" → "Set Up"');
console.log('3. Go to Basic Display settings\n');

// Step 3: Configure OAuth
console.log('🔗 Step 3: Configure OAuth Redirect URIs');
console.log('Add these redirect URIs:');
console.log('- http://localhost:3000/auth/instagram/callback');
console.log('- http://localhost:3001/api/instagram/oauth/instagram/callback\n');

// Step 4: Add Test User
console.log('👤 Step 4: Add Instagram Test User');
console.log('1. Click "Add or Remove Instagram Testers"');
console.log('2. Add your Instagram username');
console.log('3. Accept invitation in Instagram app\n');

// Step 5: Generate Token
console.log('🔑 Step 5: Generate User Access Token');
console.log('1. Go to "User Token Generator"');
console.log('2. Select your test user');
console.log('3. Generate token with scopes: user_profile, user_media\n');

// Step 6: Update .env
console.log('📝 Step 6: Update .env file');
console.log('Replace these values in your .env file:');
console.log('INSTAGRAM_CLIENT_ID=your_app_id_from_step_1');
console.log('INSTAGRAM_CLIENT_SECRET=your_app_secret_from_step_1');
console.log('INSTAGRAM_ACCESS_TOKEN=your_generated_token_from_step_5\n');

console.log('✅ Once completed, restart server: npm run dev');
console.log('🎉 Instagram connection will work perfectly!');

// Create a template .env update
const envTemplate = `
# After creating your Instagram app, update these values:
# INSTAGRAM_CLIENT_ID=your_actual_app_id_here
# INSTAGRAM_CLIENT_SECRET=your_actual_app_secret_here  
# INSTAGRAM_ACCESS_TOKEN=your_generated_user_token_here
`;

fs.writeFileSync('instagram-env-template.txt', envTemplate);
console.log('\n📄 Created instagram-env-template.txt for reference');
