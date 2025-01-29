const { getSocialConfig } = require('../config/socialconfig');
const profileModels = require('../models/profile.models');
const usersModels = require('../models/userModel');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

module.exports = passport => {
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
        usersModels.findOne({ _id: jwt_payload.id }, function(err, user) {
            if (err) {
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        });
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
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
    (async () => {
        const googleConfig = await getSocialConfig('google');
        passport.use(
            new GoogleStrategy(
                {
                    clientID: googleConfig.clientID,
                    clientSecret: googleConfig.clientSecret,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL,
                    authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
                    tokenURL: 'https://accounts.google.com/o/oauth2/token',
                },
                async (accessToken, refreshToken, profile, done) => {

                    try {
                        let user = await usersModels.findOne({ email: profile.emails[0].value });

                        if (user) {
                            if (!user.googleId) {
                                user.googleId = profile.id;
                                user.avatar = profile.photos[0].value;
                                await user.save();
                            }
                        } else {
                            user = await usersModels.create({
                                googleId: profile.id,
                                name: profile.displayName,
                                email: profile.emails[0].value,
                                avatar: profile.photos[0].value,
                                verified: true,
                                role: 'PARTNER',
                                firstLoginByThirdParty: true,
                            });
                            await profileModels.create({
                                user: user._id,
                                avatar: profile.photos[0].value,
                                tel: undefined,
                            });
                        }

                        return done(null, user);
                    } catch (err) {
                        console.error(err);
                        return done(err, null);
                    }
                }
            )
        );
    })();

    // LinkedIn Strategy
    (async () => {
        const linkedinConfig = await getSocialConfig('linkedin');
        passport.use(
            new LinkedInStrategy(
                {
                    clientID: linkedinConfig.clientID,
                    clientSecret: linkedinConfig.clientSecret,
                    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
                    scope: ['openid', 'profile', 'email'],
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {

                        let user = await usersModels.findOne({ email: profile.email });
                        if (user) {
                            if (!user.linkedinId) {
                                user.linkedinId = profile.id;
                                user.avatar = profile.picture;
                                await user.save();
                            }
                        } else {
                            user = await usersModels.create({
                                linkedinId: profile.id,
                                name: profile.displayName,
                                email: profile.email,
                                avatar: profile.picture,
                                verified: true,
                                role: 'PARTNER',
                                firstLoginByThirdParty: true,
                            });
                            await profileModels.create({
                                user: user._id,
                                avatar: profile.picture,
                                tel: undefined,
                            });
                        }
                        return done(null, user);
                    } catch (err) {
                        return done(err, null);
                    }
                }
            )
        );
    })();
};
