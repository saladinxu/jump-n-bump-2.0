/*global window, document, $:false */

'use strict';

// Setup animation framing for different vendors
(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x=0; x<vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      var currTime = new Date.getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() {
        callback(currTime + timeToCall);
      });
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
}());

var game = {
  width : 800,
  height : 450,

  friction : 0.8,
  gravity : 0.3,

  players : [],
  boxes : [],

  init : function() {
    game.canvas = $('#gamecanvas')[0];
    game.context = game.canvas.getContext('2d');

    game.canvas.width = game.width;
    game.canvas.height = game.height;

    game.createPlayers();
    game.createBoxes();

    game.start();
  },

  createPlayers : function () {
    var player1 = {
      name : 'Bumpy',
      score : 0,

      x : 600, 
      y : game.height - 20, 
      width : 20, 
      height : 35, 

      keys : {
        up : 38,     // up arrow
        left : 37,   // left arrow 
        right : 39   // right arrow
      },

      keyMotion : {
        up : false,
        left : false,
        right : false
      },

      keyAccX : 1.2,
      maxSpeedX : 3,
      velJump : -8,

      velX : 0,
      velY : 0,
      accX : 0,
      accY : 0,
      jumping : false,
      grounded : false,

      color : 'red'
    };

    var player2 = {
      name : 'Jumpy',
      score : 0,

      x : 200, 
      y : game.height - 20, 
      width : 20, 
      height : 35, 

      keys : {
        up : 87,     // W
        left : 65,   // A 
        right : 68   // D
      },

      keyMotion : {
        up : false,
        left : false,
        right : false
      },

      keyAccX : 1,
      maxSpeedX : 7,
      velJump : -7,

      velX : 0,
      velY : 0,
      accX : 0,
      accY : 0,
      jumping : false,
      grounded : false,

      color : 'blue'
    };

    game.players.push(player1);
    game.players.push(player2);

    // key bindings
    game.players.forEach(function(player){
      $(document).keydown(function(event){
        switch(event.keyCode) {
        case player.keys.up :
          player.keyMotion.up = true;
          break;
        case player.keys.left : 
          player.keyMotion.left = true;
          break;
        case player.keys.right :
          player.keyMotion.right = true;
          break;
        default:
          break;
        }
      });

      $(document).keyup(function(event){
        switch(event.keyCode) {
        case player.keys.up :
          player.keyMotion.up = false;
          break;
        case player.keys.left : 
          player.keyMotion.left = false;
          break;
        case player.keys.right :
          player.keyMotion.right = false;
          break;
        default:
          break;
        }
      });
    });
  },

  createBoxes : function() {
    // walls & floor
    game.boxes.push({
      x: 0,
      y: 0,
      width: 10,
      height: game.height
    });
    game.boxes.push({
      x: 0,
      y: game.height - 2,
      width: game.width,
      height: 50
    });
    game.boxes.push({
      x: game.width - 10,
      y: 0,
      width: 50,
      height: game.height
    });

    // platforms
    game.boxes.push({
      x: 600,
      y: 410,
      width: 200,
      height: 20
    });
    game.boxes.push({
      x: 350,
      y: 350,
      width: 180,
      height: 30
    });
    game.boxes.push({
      x: 220,
      y: 280,
      width: 140,
      height: 40
    });
    game.boxes.push({
      x: 270,
      y: 220,
      width: 530,
      height: 10
    });
    game.boxes.push({
      x: 220,
      y: 160,
      width: 480,
      height: 10
    });
    game.boxes.push({
      x: 20,
      y: 170,
      width: 50,
      height: 270
    });
    game.boxes.push({
      x: 70,
      y: 130,
      width: 50,
      height: 310
    });
    game.boxes.push({
      x: 120,
      y: 100,
      width: 50,
      height: 340
    });
  },

  start : function() {
    game.players.forEach(function(player) {
      respawn(player);
    });
    window.requestAnimationFrame(game.animate, game.canvas);
  },

  animate : function() {
    var ctx = game.context;

    // set background
    ctx.clearRect(0, 0, game.width, game.height);
    ctx.fillStyle = 'black';
    ctx.beginPath();
    
    // draw boxes
    game.boxes.forEach(function(box){
      ctx.rect(box.x, box.y, box.width, box.height);
    });
    ctx.fill();

    game.players.forEach(function(player, i1) {
      // check key motions
      if (player.keyMotion.up) {
        if (!player.jumping && player.grounded) {
          player.jumping = true;
          player.grounded = false;
          player.velY = player.velJump;
        }
      }
      if (player.keyMotion.left) {
        player.accX = -player.keyAccX;
      }
      if (player.keyMotion.right) {
        player.accX = player.keyAccX;
      }
      if (!player.keyMotion.left && !player.keyMotion.right) {
        player.accX = 0;
      }

      // update speed
      player.velX += player.accX;
      player.velX *= game.friction;
      if (Math.abs(player.velX) > player.maxSpeedX) {
        player.velX = player.maxSpeedX * (player.velX > 0 ? 1 : -1);
      }
      player.velY += (player.accY + game.gravity);

      // update positions      
      player.x += player.velX;
      player.y += player.velY;

      // box collision check
      player.grounded = false;
      game.boxes.forEach(function(box) {
        var result = collisionCheck(player, box);

        if (result.col) {
          player.x += result.dX;
          player.y += result.dY;

          if (Math.abs(result.dX) > 0) { // player hitting left/right
            player.velX = 0;
          }
          if (result.dY > 0 && player.velY < 0) { // player hitting head
            player.velY *= -1;
          } else if (result.dY < 0) { // player hitting feet
            player.grounded = true;
            player.jumping = false;
            player.velY = 0;
          }
        }
      });

      // player collision check
      game.players.forEach(function(otherPlayer, i2) {
        if (i1 != i2) {
          var check = collisionCheck(player, otherPlayer);
          if (check.col) {
            if (Math.abs(check.dX) > 0) { // player hitting left/right
              player.velX = 0;
              player.x += check.dX;
            }
            if (check.dY < 0) { // Stepping on other player
              respawn(otherPlayer);
              player.score++;
            } else if (check.dY > 0) { // being stomped by other player
              respawn(player);
              otherPlayer.score++;
            }
          }
        }
      });

    });

    // draw player and score
    game.players.forEach(function(player, index) {
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.width, player.height);

      ctx.font = '60px Calibri';
      ctx.fillText(player.score, game.width / 2 - (game.players.length - index - 1) * 60, 50);
      if (index < game.players.length - 1) {
        ctx.fillStyle = 'black';
        ctx.fillText(':', game.width / 2 - (game.players.length - index - 1) * 60 + 35, 50);
      }
    });

    // update debug info
    $('#debugconsolep1').html(printPlayerDebugInfo(game.players[0]));
    $('#debugconsolep2').html(printPlayerDebugInfo(game.players[1]));
    window.requestAnimationFrame(game.animate, game.canvas);
  }
};

function printPlayerDebugInfo(player) {
  return '--- ' + player.name + ' ---' +
         'Position\n\tx : ' + player.x.toFixed(2) + '\n\ty : ' + player.y.toFixed(2) +
         '\nVelocity\n\tx : ' + player.velX.toFixed(2) + '\n\ty : ' + player.velY.toFixed(2) + 
         '\nAccelecration\n\tx : ' + player.accX.toFixed(2) + '\n\ty : ' + player.accY.toFixed(2);
}

function respawn(player) {
  var badPos, newX, newY;

  do {
    badPos = false;

    newX = Math.random() * game.width;
    newY = Math.random() * game.height;
    
    game.boxes.forEach(function(box) {
      var res = collisionCheck({
        x : newX, 
        y : newY, 
        width : player.width,
        height : player. height
      }, box);
      badPos = badPos || res.col;
    });
  } while (badPos);

  player.x = newX;
  player.y = newY;
  player.velX = 0;
  player.velY = 0;
  player.accX = 0;
  player.accY = 0;
  player.jumping = false;
  player.grounded = false;
}

function collisionCheck(player, obj) {
  // get the vectors to check against
  var vX = (player.x + (player.width / 2)) - (obj.x + (obj.width / 2)),
      vY = (player.y + (player.height / 2)) - (obj.y + (obj.height / 2)),
      // add the half widths and half heights of the objects
      hWidths = (player.width / 2) + (obj.width / 2),
      hHeights = (player.height / 2) + (obj.height / 2),
      dX = 0, dY = 0;

  // if the x and y vector are less than the half width or half height, they we must be inside the object, causing a collision
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
  var result = dX * dX + dY * dY > 0;
  return { col : result, dX : dX, dY : dY };
}

$(function() {
  game.init();
});
