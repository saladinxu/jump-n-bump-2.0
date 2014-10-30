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

                ctx.canvas.width = ctx.canvas.clientWidth;
                ctx.canvas.height = ctx.canvas.width*Game.aspectRatio;
                scale = ctx.canvas.width/Game.width;

                // Draw background
                ctx.clearRect(0, 0, Game.width * scale, Game.height * scale);
                
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
                    ctx.fillStyle = 'white';
                    ctx.fillRect( // ear
                        (player.x + player.width / 3) * scale,
                        player.y * scale,
                        player.width / 3 * scale,
                        player.height / 8 * scale
                    );
                    ctx.fillRect( // left eye
                        (player.x + player.width / 4) * scale,
                        (player.y + player.height / 4) * scale,
                        player.width / 6 * scale,
                        player.height / 10 * scale
                    );
                    ctx.fillRect( // right eye
                        (player.x + player.width * (1 - 1/4 - 1/6)) * scale,
                        (player.y + player.height / 4) * scale,
                        player.width / 6 * scale,
                        player.height / 10 * scale
                    );
                    ctx.fillRect( // left face
                        player.x * scale,
                        (player.y + player.height / 2.2) * scale,
                        player.width / 3 * scale,
                        player.height / 10 * scale
                    );
                    ctx.fillRect( // right face
                        (player.x + player.width * 2 / 3) * scale,
                        (player.y + player.height / 2.2) * scale,
                        player.width / 3 * scale,
                        player.height / 10 * scale
                    );
                    ctx.fillRect( // left arm
                        player.x * scale,
                        (player.y + player.height / 1.5) * scale,
                        player.width / 3 * scale,
                        player.height / 8 * scale
                    );
                    ctx.fillRect( // right arm
                        (player.x + player.width * 2 / 3) * scale,
                        (player.y + player.height / 1.5) * scale,
                        player.width / 3 * scale,
                        player.height / 8 * scale
                    );
                    ctx.fillRect( // bottom
                        (player.x + player.width / 6) * scale,
                        (player.y + player.height * (1 - 1/8))* scale,
                        player.width * 2 / 3 * scale,
                        player.height / 8 * scale
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
