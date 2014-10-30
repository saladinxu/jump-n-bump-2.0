/*global routingConfig*/

'use strict';

angular.module('jump-n-bump-2').factory('Auth', function($http, $cookieStore) {

    var accessLevels = routingConfig.accessLevels, 
        userRoles =    routingConfig.userRoles,
        currentUser =  $cookieStore.get('user') || { username: '', role: userRoles.public };

    $cookieStore.remove('user');

    function changeUser(user) {
        angular.extend(currentUser, user);
    }

    return {
        authorize: function(accessLevel, role) {
            if(role === undefined) {
                role = currentUser.role;
            }

            return accessLevel.bitMask & role.bitMask;
        },
        isLoggedIn: function(user) {
            if(user === undefined) {
                user = currentUser;
            }
            return user.role.title === userRoles.user.title || user.role.title === userRoles.admin.title;
        },
        signup: function(user, success, error) {
            $http.post('/signup', user).success(function(user) {
                changeUser(user);
                success();
            }).error(error);
        },
        login: function(user, success, error) {
            $http.post('/login', user).success(function(user){
                changeUser(user);
                success(user);
            }).error(error);
        },
        logout: function(success, error) {
            $http.post('/logout').success(function(){
                changeUser({
                    username: '',
                    role: userRoles.public
                });
                success();
            }).error(error);
        },
        accessLevels: accessLevels,
        userRoles: userRoles,
        user: currentUser
    };
});

angular.module('jump-n-bump-2').factory('Socket', function(socketFactory) {
    return socketFactory();
});

angular.module('jump-n-bump-2').factory('Game', function() {
    var width = 0, 
        height = 0, 
        players = [], 
        platforms = [],
        ax = 0, 
        ay = 0,
        aspectRatio;
    return {
        width : width,
        height : height,
        players : players,
        platforms : platforms,
        ax : ax,
        ay : ay,
        aspectRatio : aspectRatio
    };
});

angular.module('angular-client-side-auth')
.factory('Leaderboard', function($http) {
    return {
        getAllUserInfo : function(success, error) {
            $http.get('/alluserinto').success(success).error(error);
        },
        getAllGameEvents : function(success, error) {
            $http.get('/gameevents').success(success).error(error);
        }
    };
});
