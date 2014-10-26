/*global window, _*/

'use strict';

angular.module('jump-n-bump-2').directive('accessLevel', ['Auth', function(Auth) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var prevDisp = element.css('display'), 
                userRole, 
                accessLevel;

            scope.user = Auth.user;
            scope.$watch('user', function(user) {
                if (user.role){
                    userRole = user.role;
                }
                updateCSS();
            }, true);

            attrs.$observe('accessLevel', function(al) {
                if (al) {
                    accessLevel = scope.$eval(al);
                }
                updateCSS();
            });

            function updateCSS() {
                if(userRole && accessLevel) {
                    if (!Auth.authorize(accessLevel, userRole)) {
                        element.css('display', 'none');
                    } else {
                        element.css('display', prevDisp);
                    }
                }
            }
        }
    };
}]);

angular.module('jump-n-bump-2').directive('activeNav', ['$location', function($location) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var anchor = element[0];
            if(element[0].tagName.toUpperCase() != 'A') {
                anchor = element.find('a')[0];
            }
            var path = anchor.href;

            scope.location = $location;
            scope.$watch('location.absUrl()', function(newPath) {
                path = normalizeUrl(path);
                newPath = normalizeUrl(newPath);

                if(path === newPath ||
                    (attrs.activeNav === 'nestedTop' && newPath.indexOf(path) === 0)) {
                    element.addClass('active');
                } else {
                    element.removeClass('active');
                }
            });
        }

    };

    function normalizeUrl(url) {
        if(url[url.length - 1] !== '/')
            url = url + '/';
        return url;
    }

}]);

angular.module('jump-n-bump-2').directive('gameScreen', 
['Game', '$document', 'Socket', 'Auth', function(Game, $document, Socket, Auth) {
    return {
        restrict : 'A',
        link : function (scope, element) {
            var ctx = element[0].getContext('2d');
            
            Socket.emit('join', {
                name : Auth.user.username
            });

            Socket.on('init', function (data) {
                Game.width = data.width;
                Game.height = data.height;
                Game.aspectRatio = data.height/data.width;
            });

            Socket.on('frame', function(data){
                Game.players = data.players;
                Game.platforms = data.platforms;
            });

            // Key bindings
            $document.bind('keydown', function(event) {
                var needEmit = true;
                switch (event.which) {
                case 87: // W
                    Game.ay=-1;
                    break;
                case 65: // A
                    Game.ax=-1;
                    break;
                case 68: // D
                    Game.ax=1;
                    break;
                default:
                    needEmit = false;
                    break;
                }
                if (needEmit) {
                    Socket.emit('motion', { ax : Game.ax, ay : Game.ay });
                }
            });

            $document.bind('keyup', function(event) {
                var needEmit = true;
                switch (event.which) {
                case 87: // W
                    Game.ay=0;
                    break;
                case 65: // A
                    Game.ax=0;
                    break;
                case 68: // D
                    Game.ax=0;
                    break;
                default:
                    needEmit = false;
                    break;
                }
                if (needEmit) {
                    Socket.emit('motion', { ax : Game.ax, ay : Game.ay });
                }
            });

            // Animation Frame
            var animate = function() {
                var scale;

                // Set relative size
                var windowHeight = window.innerHeight,
                    windowWidth = window.innerWidth;

                if (windowHeight > windowWidth*Game.aspectRatio) {
                    ctx.canvas.width = windowWidth*0.7;
                    ctx.canvas.height = ctx.canvas.width*Game.aspectRatio;
                    scale = ctx.canvas.width/Game.width;
                } else {
                    ctx.canvas.height = windowHeight*0.7;
                    ctx.canvas.width = ctx.canvas.height/Game.aspectRatio;
                    scale = ctx.canvas.height/Game.height;
                }

                ctx.clearRect(0, 0, Game.width * scale, Game.height * scale);
                // Draw background

                // Draw platforms
                _.each(Game.platforms, function(platform) {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(
                        platform.x * scale, 
                        platform.y * scale, 
                        platform.width * scale, 
                        platform.height * scale
                    );
                });

                // Draw players
                _.each(Game.players, function(player) {
                    ctx.fillStyle = player.color;
                    ctx.fillRect(
                        player.x * scale, 
                        player.y * scale, 
                        player.width * scale, 
                        player.height * scale
                    ); 
                });

                // Keep going 4ever
                window.requestAnimationFrame(animate);
            };
            // Initial frame
            window.requestAnimationFrame(animate);
        }
    };
}]);
