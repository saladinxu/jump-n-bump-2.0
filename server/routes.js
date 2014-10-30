'use strict';

var _ =               require('underscore'),
    path =            require('path'),
    userCtrl =        require('./controllers/userControl'),
    leaderboardCtrl = require('./controllers/leaderboardControl'),
    userRoles =       require('../client/js/routingConfig').userRoles,
    accessLevels =    require('../client/js/routingConfig').accessLevels;

var routes = [

    // Views
    {
        path: '/partials/*',
        httpMethod: 'GET',
        middleware: [function (req, res) {
            var requestedView = path.join('./', req.url);
            res.render(requestedView);
        }]
    },

    // Local Auth
    {
        path: '/signup',
        httpMethod: 'POST',
        middleware: [userCtrl.signup]
    },
    {
        path: '/login',
        httpMethod: 'POST',
        middleware: [userCtrl.login]
    },
    {
        path: '/logout',
        httpMethod: 'POST',
        middleware: [userCtrl.logout]
    },
    {
        path: '/alluserinfo',
        httpMethod: 'GET',
        middleware: [leaderboardCtrl.getAllUserInfo]
    },
    {
        path: '/gameevents',
        httpMethod: 'GET',
        middleware: [leaderboardCtrl.getAllGameEvents]
    },

    // All other get requests should be handled by AngularJS's client-side routing system
    {
        path: '/*',
        httpMethod: 'GET',
        middleware: [function(req, res) {
            var role = userRoles.public, username = '';
            if(req.user) {
                role = req.user.role;
                username = req.user.username;
            }
            res.cookie('user', JSON.stringify({
                'username': username,
                'role': role
            }));
            res.render('index');
        }]
    }
];

module.exports = function(app) {
    _.each(routes, function(route) {
        route.middleware.unshift(ensureAuthorized);
        var args = _.flatten([route.path, route.middleware]);

        switch(route.httpMethod.toUpperCase()) {
        case 'GET' :
            app.get.apply(app, args);
            break;
        case 'POST' :
            app.post.apply(app, args);
            break;
        case 'PUT' :
            app.put.apply(app, args);
            break;
        case 'DELETE' :
            app.delete.apply(app, args);
            break;
        default :
            throw new Error('Invalid HTTP method specified for route ' + route.path);
        }
    });
};

function ensureAuthorized(req, res, next) {
    var role;
    if (!req.user) {
        role = userRoles.public;
    } else {
        role = req.user.role;
    }
    var accessLevel = _.findWhere(routes, { 
        path: req.route.path, 
        httpMethod: req.route.stack[0].method.toUpperCase() 
    }).accessLevel || accessLevels.public;

    if(!(accessLevel.bitMask & role.bitMask)) return res.send(403);
    return next();
}
