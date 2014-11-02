'use strict';

var _ =             require('underscore'),
    LocalStrategy = require('passport-local').Strategy,
    validator =     require('validator'),
    userRoles =     require('../../client/js/routingConfig').userRoles,
    db;

var users = [];

module.exports = {
    setDb: function(_db) {
        db = _db;
    },
    loadAllFromDb: function() {
        db.bind('users');
        db.users.find().toArray(function(err, result) {
            if (result) {
                users = result;
            }
        });
    },
    addUser: function(username, password, role, callback) {
        if(this.findByUsername(username) !== undefined) {
            return callback("UserAlreadyExists");
        }
        
        var user = {
            id:         (_.max(users, function(user) { return user.id; }).id || 0) + 1,
            username:   username,
            password:   password,
            role:       role
        };
        users.push(user);
        db.users.insert(user, function(err, result) {
            callback(err, user);
        });
    },

    findAll: function() {
        return _.map(users, function(user) { return _.clone(user); });
    },

    findById: function(id) {
        return _.clone(_.find(users, function(user) { return user.id === id }));
    },

    findByUsername: function(username) {
        return _.clone(_.find(users, function(user) { return user.username === username; }));
    },

    validate: function(user) {
        if (!validator.isLength(user.username, 1, 20)) {
            return "Username must be 1-20 characters long";
        }
        if (!validator.isLength(user.password, 5, 16)) {
            return "Password must be 5-16 characters long";
        }
        if (!validator.isAlphanumeric(user.username)) {
            return "Username must contain only numbers or letters";
        }
        if (!_.find(_.values(userRoles), function(x) {
            return _.isEqual(x, user.role);
        })) {
            return "User role attempted to created is invalid: " + user.role;
        }
    },

    localStrategy: new LocalStrategy(
        function(username, password, done) {

            var user = module.exports.findByUsername(username);

            if(!user) {
                done(null, false, { message: 'Incorrect username.' });
            }
            else if(user.password != password) {
                done(null, false, { message: 'Incorrect username.' });
            }
            else {
                return done(null, user);
            }

        }
    ),

    serializeUser: function(user, done) {
        done(null, user.id);
    },

    deserializeUser: function(id, done) {
        var user = module.exports.findById(id);

        if(user)    { done(null, user); }
        else        { done(null, false); }
    }
};