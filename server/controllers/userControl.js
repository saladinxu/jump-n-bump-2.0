'use strict';

var passport =  require('passport'),
    User = require('../models/User.js');

module.exports = {
    signup: function(req, res, next) {
        var body = req.body;
        var validationResult = User.validate(body);
        if (validationResult) {
            return res.status(400).send(validationResult);
        }

        User.addUser(
            body.username, 
            body.password, 
            body.role, 
            function(err, user) {
                if (err === 'UserAlreadyExists') {
                    return res.status(400).send("User already exists");
                } else if (err){
                    return res.status(500).send(err);
                }

                req.logIn(user, function(err) {
                    if (err) { 
                        next(err); 
                    } else { 
                        res.status(200).json({ 
                            "role": user.role, 
                            "username": user.username 
                        }); 
                    }
                });
            }
        );
    },

    login: function(req, res, next) {
        passport.authenticate('local', function(err, user) {
            if (err) {
                return next(err); 
            }
            if (!user) {
                return res.status(400).end(); 
            }

            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }

                if (req.body.rememberme) { //7 days
                    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7;
                }
                res.status(200).send({ 
                    "role": user.role, 
                    "username": user.username 
                });
            });
        })(req, res, next);
    },

    logout: function(req, res) {
        req.logout();
        res.status(200).end();
    }
};