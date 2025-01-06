const profileModels = require('../models/profile.models');
const usersModels = require('../models/userModel');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

module.exports = passport => {
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        usersModels.findOne({_id: jwt_payload.id}, function(err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
                // or you could create a new account
            }
        });
    }));
    passport.serializeUser((user, done) => {
        done(null, user.id); // Vous pouvez stocker l'ID ou tout autre identifiant unique
      });

      passport.deserializeUser(async (id, done) => {
        try {
          const user = await usersModels.findById(id);
          done(null, user);
        } catch (err) {
          done(err, null);
        }
      });
     // Google Strategy
     passport.use(
        new GoogleStrategy(
          {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "https://convoyage.onrender.com/api/users/google/callback",
          },
          async (accessToken, refreshToken, profile, done) => {
console.log(profile);
            try {
              // Vérifiez si un utilisateur avec le même email existe déjà
              let user = await usersModels.findOne({ email: profile.emails[0].value });

              if (user) {
                // Si l'utilisateur existe mais n'a pas de `googleId`, associez-le
                if (!user.googleId) {
                  user.googleId = profile.id;
                  user.avatar = profile.photos[0].value;
                  await user.save();
                }
              } else {
                // Créez un nouvel utilisateur si aucun n'existe
                user = await usersModels.create({
                  googleId: profile.id,
                  name: profile.displayName,
                  email: profile.emails[0].value,
                  avatar: profile.photos[0].value,
                  verified: true,
                  role: "PARTNER",
                  firstLoginByThirdParty: true,
                });
                console.log(user);
                await profileModels.create({
                    user: user._id,
                    avatar: profile.photos[0].value, // Use the avatar from Google
                    tel: undefined,
                  });
              }

              return done(null, user); // Passez l'utilisateur à Passport
            } catch (err) {
              console.error(err);
              return done(err, null); // Passez l'erreur à Passport
            }
          }
        )
      );


  // LinkedIn Strategy
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: "/auth/linkedin/callback",
        scope: ["r_emailaddress", "r_liteprofile"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await usersModels.findOne({ linkedinId: profile.id });
          if (!user) {
            user = await usersModels.create({
              linkedinId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0].value,
              verified: true,
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}



