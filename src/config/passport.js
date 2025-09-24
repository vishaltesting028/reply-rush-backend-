const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

// Serialize user for session storage
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Facebook Strategy Configuration (only if credentials are available)
const facebookClientId = process.env.FACEBOOK_APP_ID || '1114184487016368';
const facebookClientSecret = process.env.FACEBOOK_APP_SECRET || '3a2be7f420d6eea8358e1341e57d389c';
const facebookCallbackUrl = process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/krunal/auth/instagram/callback';

console.log('facebookClientId ======', facebookClientId);
 
if (facebookClientId && facebookClientSecret && facebookCallbackUrl) {
  passport.use(new FacebookStrategy({
      clientID: facebookClientId,
      clientSecret: facebookClientSecret,
      callbackURL: facebookCallbackUrl,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)', 'link'],
      scope: ['email', 'public_profile', 'pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish']
    },
  async function(accessToken, refreshToken, profile, done) {
    try {
      console.log('Facebook OAuth Profile:', {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value,
        picture: profile.photos?.[0]?.value
      });

      // Check if user already exists with this Facebook ID
      let user = await User.findOne({ 'facebook.id': profile.id });

      if (user) {
        // Update existing user's Facebook data
        user.facebook = {
          id: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          picture: profile.photos?.[0]?.value,
          link: profile.profileUrl,
          accessToken: accessToken,
          refreshToken: refreshToken,
          connectedAt: user.facebook.connectedAt || new Date(),
          lastLoginAt: new Date()
        };
        
        await user.save();
        console.log('Updated existing Facebook user:', user.facebook.name);
        return done(null, user);
      }

      // Check if user exists with the same email
      if (profile.emails?.[0]?.value) {
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Link Facebook account to existing user
          user.facebook = {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            picture: profile.photos?.[0]?.value,
            link: profile.profileUrl,
            accessToken: accessToken,
            refreshToken: refreshToken,
            connectedAt: new Date(),
            lastLoginAt: new Date()
          };
          
          await user.save();
          console.log('Linked Facebook to existing user:', user.email);
          return done(null, user);
        }
      }

      // Create new user
      user = new User({
        name: profile.displayName,
        email: profile.emails?.[0]?.value || `facebook_${profile.id}@replyrush.com`,
        password: 'facebook_oauth_' + Math.random().toString(36).substring(7), // Random password for OAuth users
        facebook: {
          id: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          picture: profile.photos?.[0]?.value,
          link: profile.profileUrl,
          accessToken: accessToken,
          refreshToken: refreshToken,
          connectedAt: new Date(),
          lastLoginAt: new Date()
        },
        // Initialize empty Instagram object for future connection
        instagram: {
          username: null,
          accessToken: null,
          instagramUserId: null,
          accountType: null,
          mediaCount: 0,
          followersCount: 0,
          followingCount: 0,
          biography: null,
          website: null,
          profilePictureUrl: null,
          isConnected: false,
          connectedAt: null,
          lastSyncAt: null,
          media: [],
          profile: null
        }
      });

      await user.save();
      console.log('Created new Facebook user:', user.facebook.name);
      
      return done(null, user);

    } catch (error) {
      console.error('Facebook OAuth Strategy Error:', error);
      return done(error, null);
    }
  }
  ));
  
  console.log('✅ Facebook Strategy configured successfully');
} else {
  console.log('⚠️ Facebook Strategy not configured - missing credentials');
  console.log('Required: FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK_URL');
}

module.exports = passport;
