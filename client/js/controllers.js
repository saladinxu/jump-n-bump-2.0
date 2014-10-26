'use strict';

angular.module('jump-n-bump-2').controller('NavCtrl', 
['$rootScope', '$scope', '$location', 'Auth', function($rootScope, $scope, $location, Auth) {
    $scope.user = Auth.user;
    $scope.userRoles = Auth.userRoles;
    $scope.accessLevels = Auth.accessLevels;

    $scope.logout = function() {
        Auth.logout(function() {
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
            function() { $location.path('/game'); },
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

angular.module('jump-n-bump-2').controller('GameCtrl',
['$scope', 'Socket', 'Auth', function ($scope, Socket, Auth) {
    $scope.Socket = Socket;
    $scope.joinGame = function() {
        Socket.emit('join', { username : username });
    };
}]);

angular.module('jump-n-bump-2').controller('LeaderboardCtrl',
['$rootScope', '$scope', '$location', 'Auth', function($rootScope, $scope, $location, Auth) {
    $scope.role = Auth.userRoles.user;
    $scope.userRoles = Auth.userRoles;

    $scope.getLeaderboardData = function() {
        console.log('in progress...');
    };
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

