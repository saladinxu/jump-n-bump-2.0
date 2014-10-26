'use strict';

var sio =       require('socket.io'),
    _ =         require('underscore'),
    gameWidth,
    gameHeight,
    players =   {},
    colors,
    platforms,
    friction,
    gravity,
    accel,
    maxV,
    jumpV,
    io;

module.exports = {
    initialize : function(server) {
        gameInit();
        io = sio(server);
        io.on('connection', function(socket) {
            console.log('[' + socket.id + '] connection established');
            handleJoinGame(socket);
            handleMotionChange(socket);
            var timer = setInterval(function() {
                socket.emit('frame', encapsulateFrameData());
            }, 10);
            handleLeaveGame(socket, timer);
        });
    },
};

function gameInit() {
    gameWidth = 800;
    gameHeight = 500;
    colors = { 
        usable : ['green', 'purple', 'red', 'blue', 'orange', 'pink'],
        taken : []
    };
    platforms = [{
        x : 0, // ceiling
        y : 0,
        width: gameWidth,
        height: 10
    }, {
        x : 0, // floor
        y : gameHeight - 10,
        width: gameWidth,
        height: 10
    }, {
        x : 0, // left wall
        y : 10,
        width: 10,
        height: gameHeight - 20
    }, {
        x : gameWidth - 10, // right wall
        y : 10,
        width: 10,
        height: gameHeight - 20
    }, {
        x : 110, // J1
        y : 100,
        width: 400,
        height: 40
    }, {
        x : 300, // J2
        y : 120,
        width: 20,
        height: 300
    }, {
        x : 120, // J3
        y : 400,
        width: 200,
        height: 20
    }, {
        x : 120, // J4
        y : 370,
        width: 20,
        height: 50
    }, {
        x : 400, // stair1
        y : 430,
        width: 121,
        height: 70
    }, {
        x : 520, // stair2
        y : 330,
        width: 151,
        height: 170
    }, {
        x : 670, // stair3
        y : 230,
        width: 130,
        height: 270
    }, {
        x : 550, // -1
        y : 180,
        width: 60,
        height: 5
    }, {
        x : 0, // -2
        y : 250,
        width: 80,
        height: 10
    }];
    accel = 1;
    maxV = 7;
    jumpV = -8;
    gravity = 0.3;
    friction = 0.85;

    setInterval(function() { updateFrame(); }, 10);
} 

function handleJoinGame(socket) {
    socket.on('join', function(data) {
        console.log('[' + socket.id + '] joined the game');
        var dupSocketId = _.find(_.keys(players), function(key){
            return players[key].name === data.name;
        });
        if (dupSocketId !== undefined) {
            console.log([socket.id] + ' found previous user socket: ' + dupSocketId);
            players[socket.id] = players[dupSocketId];
            delete players[dupSocketId];
        } else {
            var color = colors.usable[0];
            colors.usable = _.rest(colors.usable);
            colors.taken.push(color);
            players[socket.id] = {
                name : data.name,
                color : color,
                width : 30,
                height : 50
            };
            respawn(players[socket.id]);
        }
        socket.emit('init', { 
            width : gameWidth, 
            height : gameHeight
        });
    });
}

function respawn(player) {
    var newX, newY, playerNext, badPos;
    do {
        newX = Math.random() * gameWidth;
        newY = Math.random() * gameHeight;
        playerNext = _.extend(player, {x : newX, y : newY});
        badPos = false;

        _.each(platforms, function(platform) {
            var colCheck = collisionCheck(playerNext, platform),
                isBad = Math.abs(colCheck.x) > 0 || Math.abs(colCheck.y) > 0;
            badPos = badPos || isBad;
        });
    } while (badPos);
    _.extend(player, {
        x : newX,
        y : newY,
        vx : 0,
        vy : 0,
        ax : 0,
        ay : 0,
        state : {
            jumping : false,
            grounded : false
        }
    });
    console.log(player.name + ' respawned');
}

function handleMotionChange(socket) {
    socket.on('motion', function(data) {
        if (players.hasOwnProperty(socket.id)) {
            players[socket.id].ax = data.ax * accel;
            players[socket.id].ay = data.ay;
        } else {
            socket.emit('stale', { msg: 'You are using a stale session. Please refresh your browser or log in again.'});
        }
    });
}

function handleLeaveGame(socket, timer) {
    socket.on('leave', function() {
        if (players.hasOwnProperty(socket.id)) {
            var color = players[socket.id].color;
            colors.usable.push(color);
            colors.taken = _.without(colors.taken, color);
            
            console.log('[' + socket.id + '] left the game');
            delete players[socket.id];
            clearInterval(timer);
        }
    });
    socket.on('disconnect', function() {
        if (players.hasOwnProperty(socket.id)) {
            var color = players[socket.id].color;
            colors.usable.push(color);
            colors.taken = _.without(colors.taken, color);
            
            console.log('[' + socket.id + '] disconnected');
            delete players[socket.id];
            clearInterval(timer);
        }
    });
}

function updateFrame() {
    _.each(_.values(players), function(player) {
        // jumping or not
        if (player.ay === -1) {
            if (!player.state.jumping && player.state.grounded) {
                player.state.jumping = true;
                player.state.grounded = false;
                player.vy = jumpV;
            }
        }

        // velocity update
        player.vx += (player.ax * accel);
        if (Math.abs(player.vx) > maxV) {
            player.vx = maxV * (player.vx > 0 ? 1 : -1);
        }
        player.vx *= friction;
        
        player.vy += gravity;

        // position update
        var dx = 0, 
            dy = 0,
            playerNext = _.extend(player, {
                x : player.x + player.vx,
                y : player.y + player.vy
            });

        // box collision check
        player.state.grounded = false;
        _.each(platforms, function(platform) {
            var result = collisionCheck(playerNext, platform),
                ox = result.x, 
                oy = result.y;
            if (Math.abs(ox) > Math.abs(dx)) {
                dx = ox;
            }
            if (Math.abs(oy) > Math.abs(dy)) {
                dy = oy;
            }
        });
        // hitting left/right
        if (Math.abs(dx) > 0) {
            player.vx = 0;
        }
        // hitting top
        if (dy > 0 && player.vy < 0) {
            player.vy *= -1;
        } else if (dy < 0) { // hitting ground
            player.state.grounded = true;
            player.state.jumping = false;
            player.vy = 0;
        }
        // update position
        player.x += dx;
        player.y += dy;

        // player collisison check
        _.each(players, function(p2) {
            if (player.name != p2.name) {
                var colCheck = collisionCheck(player, p2);
                if (Math.abs(colCheck.x) > 0) {
                    player.vx = 0;
                    player.x += colCheck.x;
                }
                if (colCheck.y < 0) {
                    respawn(p2);
                } else if (colCheck.y > 0) {
                    respawn(player);
                }
            }
        });
    });
}

function collisionCheck(bumper, bumpee) {
    // get the vectors to check against
    var vX = (bumper.x + (bumper.width / 2)) - (bumpee.x + (bumpee.width / 2)),
        vY = (bumper.y + (bumper.height / 2)) - (bumpee.y + (bumpee.height / 2)),
        // add the half widths and half heights of the bumpee
        hWidths = (bumper.width / 2) + (bumpee.width / 2),
        hHeights = (bumper.height / 2) + (bumpee.height / 2),
        dX = 0, dY = 0;
  
    // if the x and y vector are less than the half width or half height, they we must be inside the bumpee, causing a collision
    if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
        // figures out on which side we are colliding (top, bottom, left, or right)
        var oX = hWidths - Math.abs(vX);
        var oY = hHeights - Math.abs(vY);
        if (oX < oY) {
            if (vX > 0) {
                dX = oX;
            } else {
                dX = -oX;
            }
        } else {
            if (vY > 0) {
                dY = oY;
            } else {
                dY = -oY;
            }
        }
    }
    return { x : dX, y : dY };
}

function encapsulateFrameData() {
    return {
        players : _.map(_.values(players), function(player) {
            return {
                name : player.name,
                color : player.color,
                x : player.x,
                y : player.y,
                width : player.width,
                height : player.height
            };
        }),
        platforms : platforms
    };
}