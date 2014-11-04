'use strict';

var sio =        require('socket.io'),
    _ =          require('underscore'),
    Scoreboard = require('./Scoreboard.js'),
    gameWidth,
    gameHeight,
    players =    {},
    colors,
    platforms,
    friction,
    gravity,
    accel,
    maxV,
    jumpV,
    io,
    nameSocketMap,
    robotName = '-= THE BOT =-';

module.exports = {
    initialize : function(server) {
        gameInit();
        io = sio(server);
        io.on('connection', function(socket) {
            console.log('[' + socket.id + '] connection established');
            handleJoinGame(socket);
            handleMotionChange(socket);
            handleLeaveGame(socket);
        });
    },
};

function gameInit() {
    gameWidth = 800;
    gameHeight = 500;
    colors = { 
        usable : ['green', 'purple', 'red', 'blue', 'orange'],
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
        width: 80,
        height: 10
    }, {
        x : 240, // J4
        y : 400,
        width: 80,
        height: 10
    }, {
        x : 120, // J5
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
        height: 5,
        moving: true,
        dx : 50,
        cx : 550,
        t : 0
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

    nameSocketMap = {};

    createRobot();

    setInterval(updateFrame, 10);
} 

function createRobot() {
    var score = Scoreboard.getUserRecord(robotName);
    players[robotName] = {
        name : robotName,
        color : 'gray',
        width : 15,
        height : 25,
        win : score.kill,
        lose : score.death,
        kill : 0
    };

    respawn(players[robotName]);
    changeRobotMovement();
}

function changeRobotMovement() {
    var robot = players[robotName];
    if (robot.ax === 0) {
        robot.ax = Math.random() > 0.5 ? accel : -accel;
    }
    var rx = Math.random();
    if (rx > 0.7) {
        robot.ax *= 1;
    } else if (rx < 0.5) {
        robot.ax *= -1;
    } else {
        robot.ax = 0;
    }
    
    robot.ay = Math.random() > 0.6 ? -1 : 0;
    setTimeout(changeRobotMovement, 200 + (Math.random() * 100));
}

function handleJoinGame(socket) {
    socket.on('join', function(data) {
        console.log('[' + socket.id + '] joined the game');
        var dupSocketId = nameSocketMap.hasOwnProperty(data.name) ? nameSocketMap[data.name].id : undefined;
        if (dupSocketId !== undefined) {
            console.log([socket.id] + ' found previous user socket: ' + dupSocketId);
            nameSocketMap[data.name] = socket;
            players[socket.id] = players[dupSocketId];
            if (socket.id != dupSocketId) {
                delete players[dupSocketId];
            }

            socket.emit('score', extractScores());
            socket.broadcast.emit('score', extractScores());

        } else {
            nameSocketMap[data.name] = socket;

            var color = colors.usable[0];
            colors.usable = _.rest(colors.usable);
            colors.taken.push(color);
            
            var score = Scoreboard.getUserRecord(data.name);

            players[socket.id] = {
                name : data.name,
                color : color,
                width : 24,
                height : 40,
                win : score.kill,
                lose : score.death,
                kill : 0
            };
            var joinerInfo = { 
                name : data.name, 
                color : color, 
                time : new Date().getTime()
            };

            socket.emit('score', extractScores());
            socket.broadcast.emit('score', extractScores());
            socket.emit('joiner', joinerInfo);
            socket.broadcast.emit('joiner', joinerInfo);
            respawn(players[socket.id]);
        }
        socket.emit('init', { 
            width : gameWidth, 
            height : gameHeight
        });
    });
}

function extractScores() {
    return _.map(_.values(players), function(player){
        return {
            name : player.name,
            color : player.color,
            win : player.win,
            lose : player.lose,
            kill : player.kill
        };
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
        born : new Date().getTime(),
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

function handleLeaveGame(socket) {
    socket.on('leave', function() {
        if (players.hasOwnProperty(socket.id)) {
            var name = players[socket.id].name;
            var color = players[socket.id].color;
            colors.usable.push(color);
            colors.taken = _.without(colors.taken, color);
            
            console.log('[' + socket.id + '] left the game');
            var leaverInfo = { name : name, color : color, time : new Date().getTime() };
            socket.emit('leaver', leaverInfo);
            socket.broadcast.emit('leaver', leaverInfo);
            
            delete players[socket.id];
            delete nameSocketMap[name];

            socket.emit('score', extractScores());
            socket.broadcast.emit('score', extractScores());
        }
    });
    socket.on('disconnect', function() {
        if (players.hasOwnProperty(socket.id)) {
            var name = players[socket.id].name;
            var color = players[socket.id].color;
            colors.usable.push(color);
            colors.taken = _.without(colors.taken, color);
            
            console.log('[' + socket.id + '] disconnected');
            var leaverInfo = { name : name, color : color, time : new Date().getTime() };
            socket.emit('leaver', leaverInfo);
            socket.broadcast.emit('leaver', leaverInfo);
            
            delete nameSocketMap[name];
            delete players[socket.id];

            socket.emit('score', extractScores());
            socket.broadcast.emit('score', extractScores());
        }
    });
}

function updateFrame() {
    _.each(platforms, function(platform){
        if (platform.moving) {
            if (platform.dx) {
                platform.t+=0.01;
                platform.x = platform.cx + platform.dx*Math.sin(platform.t);
            }
        }
    });
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
                    handleKillEvent(player, p2);
                } else if (colCheck.y > 0) {
                    handleKillEvent(p2, player);
                }
            }
        });
        
    });
    // emit frame event
    _.each(_.values(nameSocketMap), function(soc) {
        soc.volatile.emit('frame', encapsulateFrameData());
    });
}

function handleKillEvent(killer, victim) {
    var killTime = new Date().getTime(),
        lifeEvent = {
            victim : victim.name,
            start : victim.born,
            end : killTime,
            kill : victim.kill,
            killer : killer.name,
            victimColor : victim.color,
            killerColor : killer.color
        };
    Scoreboard.addGameEvent(lifeEvent);
    
    var socket;
    if (victim.name == robotName) {
        socket = nameSocketMap[killer.name];
    } else {
        socket = nameSocketMap[victim.name];
    }
    socket.emit('kill', lifeEvent);
    socket.broadcast.emit('kill', lifeEvent);

    killer.kill++;
    killer.win++;
    victim.lose++;

    socket.emit('score', extractScores());
    socket.broadcast.emit('score', extractScores());

    respawn(victim);
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
        platforms : _.map(platforms, function(platform) {
            return {
                x : platform.x,
                y : platform.y,
                height : platform.height,
                width : platform.width
            };
        })
    };
}