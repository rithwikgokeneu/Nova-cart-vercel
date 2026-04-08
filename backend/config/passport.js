const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const hasGoogleCreds = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id';

if (hasGoogleCreds) {
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  const state = req.query.state || '';
  const isSignup = state.startsWith('signup_');
  const role = state === 'signup_vendor' ? 'vendor' : 'customer';
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        if (isSignup) return done(null, false, { message: 'email_taken' });
        // Login flow: link google to existing account
        user.googleId = profile.id;
        if (!user.avatar) user.avatar = profile.photos[0].value;
        await user.save();
      } else {
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          avatar: profile.photos[0].value,
          role,
          password: Math.random().toString(36).slice(-8)
        });
      }
    } else if (isSignup) {
      // Existing Google user trying to sign up again — block
      return done(null, false, { message: 'email_taken' });
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));
} // end if hasGoogleCreds

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
