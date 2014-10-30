/*global _*/

'use strict';

angular.module('jump-n-bump-2').controller('NavCtrl', 
['$rootScope', '$scope', '$location', 'Auth', 'Socket', 
function($rootScope, $scope, $location, Auth, Socket) {
    $scope.user = Auth.user;
    $scope.userRoles = Auth.userRoles;
    $scope.accessLevels = Auth.accessLevels;

    $scope.logout = function() {
        Auth.logout(function() {
            Socket.emit('leave');
            $location.path('/login');
        }, function() {
            $rootScope.error = "Failed to logout";
        });
    };
}]);

angular.module('jump-n-bump-2').controller('LoginCtrl',
['$rootScope', '$scope', '$location', '$window', 'Auth', function($rootScope, $scope, $location, $window, Auth) {
    $scope.rememberme = true;
    $scope.login = function() {
        Auth.login({
                username: $scope.username,
                password: $scope.password,
                rememberme: $scope.rememberme
            },
            function() { $location.path('/'); },
            function() { $rootScope.error = "Failed to login"; }
        );
    };
}]);

angular.module('jump-n-bump-2').controller('SignupCtrl',
['$rootScope', '$scope', '$location', 'Auth', function($rootScope, $scope, $location, Auth) {
    $scope.role = Auth.userRoles.user;
    $scope.userRoles = Auth.userRoles;

    $scope.signup = function() {
        Auth.signup({
                username: $scope.username,
                password: $scope.password,
                role: $scope.role || Auth.userRoles.user
            },
            function() { $location.path('/'); },
            function(err) { $rootScope.error = err; }
        );
    };
}]);

angular.module('jump-n-bump-2').controller('EventsCtrl',
['$scope', 'Socket', function ($scope, Socket) {
    $scope.events = [];
    $scope.maxEvent = 11;

    Socket.on('kill', function(event) {
        $scope.events.push({
            type : 'kill',
            time : event.end,
            killer : event.killer,
            victim : event.victim,
            killerColor : event.killerColor,
            victimColor : event.victimColor
        });
        if ($scope.events.length > $scope.maxEvent) {
            $scope.events = _.rest($scope.events);
        }
    });
    Socket.on('joiner', function(event) {
        $scope.events.push({
            type : 'joiner',
            time : event.time,
            name : event.name,
            color : event.color
        });
        if ($scope.events.length > $scope.maxEvent) {
            $scope.events = _.rest($scope.events);
        }
    });
    Socket.on('leaver', function(event) {
        $scope.events.push({
            type : 'leaver',
            time : event.time,
            name : event.name,
            color : event.color
        });
        if ($scope.events.length > $scope.maxEvent) {
            $scope.events = _.rest($scope.events);
        }
    });
}]);

angular.module('jump-n-bump-2').controller('ScoreControl',
['$scope', 'Socket', function($scope, Socket) {
    $scope.scores = [];
    Socket.on('score', function(data) {
        $scope.scores = data;
    });
}]);

angular.module('jump-n-bump-2').controller('LeaderboardCtrl',
['$rootScope', '$scope', 'Leaderboard', function($rootScope, $scope, Leaderboard) {
    Leaderboard.getAllGameEvents(function(res){
        $scope.gameEvents = res;
    }, function() {
        $rootScope.error = "Failed to load game events!";
    });
    Leaderboard.getAllUserInfo(function(res){
        $scope.userInfo = res;
    }, function() {
        $rootScope.error = "Failed to load player info!";
    });
}]);

angular.module('jump-n-bump-2').controller('AdminCtrl',
['$rootScope', '$scope', 'Users', 'Auth', function($rootScope, $scope, Users, Auth) {
    $scope.loading = true;
    $scope.userRoles = Auth.userRoles;

    Users.getAll(function(res) {
        $scope.users = res;
        $scope.loading = false;
    }, function() {
        $rootScope.error = "Failed to fetch users.";
        $scope.loading = false;
    });

}]);

