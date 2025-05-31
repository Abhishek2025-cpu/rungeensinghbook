// Used for authenticating the user using JWT token
require('dotenv').config();
const User = require("../models/userModel");
const passport = require('passport');

let JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

let opts = {}

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SESSION_SECREAT;

passport.use(new JwtStrategy(opts, function (record, done) {
    try {
        User.findOne({ id: record._id })
            .then(function (user) {
                return done(null, user)
            })
            .catch(function (err) {
                return done(err, false)
            })
    } catch (err) {
        return done(err, false);
    }
}));