/*global _, moment*/

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

angular.module('jump-n-bump-2').controller('LifeRecordsModalCtrl',
['$rootScope', '$scope', 'name', 'Leaderboard', 'uiGridConstants',
function($rootScope, $scope, name, Leaderboard, uiGridConstants) {
    $scope.lifeRecordsGrid = {
        showFooter: true,
        enableSorting: true,
        onRegisterApi: function(gridApi) {
            $scope.gridApi = gridApi;
        },
        columnDefs: [{
            field: 'start',
            enableSorting: false,
            sort: {
                direction: uiGridConstants.ASC,
                priority: 0
            },
            minWidth: 130
        }, {
            field: 'end',
            minWidth: 130
        }, {
            field: 'length',
            aggregationType: uiGridConstants.aggregationTypes.avg,
            width: 70
        }, {
            field: 'killedBy',
            width: 100
        }, {
            field: 'kills',
            aggregationType: uiGridConstants.aggregationTypes.avg,
            width: 50
        }]
    };
    Leaderboard.getLifeRecord(name, function(res) {
        var data = res;
        _.each(data, function(record) {
            record.start = moment(record.start).format('YYYY-MM-DD, h:mm:ss a');
            record.end = moment(record.end).format('YYYY-MM-DD, h:mm:ss a');
            record['longest life'] = convertMillisToDuration(record.longestLife);
        });
        $scope.lifeRecordsGrid.data = data;
    }, function() {
        $rootScope.error = "Failed to load player's life records!";
    });

}]);

angular.module('jump-n-bump-2').controller('LeaderboardCtrl',
['$rootScope', '$scope', '$modal','uiGridConstants', 'Leaderboard', 
function($rootScope, $scope, $modal, uiGridConstants, Leaderboard) {
    $scope.getLifeRecord = function () {
        var name = $scope.row.entity[$scope.col.field];
        $modal.open({
            template: '<div class="modal-header"><h2>Life Records of ' + name + '</h2></div>' +
                      '<div class="modal-body"><div class="gridStyle" ui-grid="lifeRecordsGrid"></div></div>',
            controller: 'LifeRecordsModalCtrl',
            resolve: {
                name: function () {
                    return name;
                }
            }
        });
    };
    $scope.playerRankGrid = {
        showFooter: true,
        enableSorting: true,
        onRegisterApi: function(gridApi) {
            $scope.gridApi = gridApi;
        },
        columnDefs: [{
            field: 'name',
            enableSorting: false,
            aggregationType: uiGridConstants.aggregationTypes.count,
            cellTemplate: '<button ng-controller="LeaderboardCtrl" class="btn btn-link" ng-click="getLifeRecord()">{{row.entity[col.field]}}</button>'
        }, {
            field: 'win',
            sort: {
                direction: uiGridConstants.DESC,
                priority: 0
            },
            aggregationType: uiGridConstants.aggregationTypes.avg
        }, {
            field: 'lose',
            sort: {
                direction: uiGridConstants.ASC,
                priority: 1
            },
            aggregationType: uiGridConstants.aggregationTypes.avg
        }, {
            field: 'win %',
            sort: {
                direction: uiGridConstants.DESC,
                priority: 2
            }
        }, {
            field: 'longest life',
            sort: {
                direction: uiGridConstants.DESC,
                priority: 4
            }
        }, {
            field: 'bestKill',
            sort: {
                direction: uiGridConstants.DESC,
                priority: 3
            }
        }]
    };

    Leaderboard.getAllGameEvents(function(res){
        //console.log(res);//$scope.playerRankGrid.data = res;
    }, function() {
        $rootScope.error = "Failed to load game events!";
    });
    Leaderboard.getAllUserInfo(function(res){
        var data = res;
        //calculated fields
        _.each(data, function(record) {
            record['win %'] = ((record.win + record.lose) > 0 ? 100*record.win/(record.win + record.lose): 0).toFixed(2) + '%';
            record['longest life'] = convertMillisToDuration(record.longestLife);
        });
        $scope.playerRankGrid.data = data;
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

function convertMillisToDuration(ms) {
    var sec = ~~(ms / 1000) % 60,
        min = ~~(ms / 1000 / 60) % 60,
        hr = ~~(ms/1000/60/60) % 24,
        day = ~~(ms/1000/60/60/24) % 7,
        week = ~~(ms/1000/60/60/24/7),
        result = '';

    if (sec) {
        result = sec + 'sec' + result;
    }
    if (min) {
        result = min + 'min ' + result;
    }
    if (hr) {
        result = hr + 'hr ' + result;
    }
    if (day) {
        result = day + 'day' + result;
    }
    if (week) {
        result = week + 'week' + result;
    }

    return result;
}