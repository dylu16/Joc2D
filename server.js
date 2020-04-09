var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var numberPlayersRed = 0;
var numberPlayersBlue = 0;

var players = {};
var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // creare jucator

  if (numberPlayersBlue >= numberPlayersRed) {
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: 'red' 
    };
    numberPlayersRed +=1;
  } else {
    players[socket.id] = {
      rotation: 0,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      playerId: socket.id,
      team: 'blue' 
    };
    numberPlayersBlue +=1;
  }

  socket.emit('currentPlayers', players);

  socket.emit('starLocation', star);
 
  socket.emit('scoreUpdate', scores);
 
  socket.broadcast.emit('newPlayer', players[socket.id]);

  // un jucator se deconecteaza
  socket.on('disconnect', function () {
    console.log('user disconnected: ', socket.id);
    if (players[socket.id].team === 'red') {
      delete players[socket.id];
      numberPlayersRed -=1;
    } else {
      delete players[socket.id];
      numberPlayersBlue -=1;
    }

    io.emit('disconnect', socket.id);
  });

  // cand un jucator se misca, update datele jucatorului
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('starCollected', function () {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * 700) + 50;
    star.y = Math.floor(Math.random() * 500) + 50;

    if (scores.red < 20 && scores.blue < 20) {
      io.emit('starLocation', star);
      io.emit('scoreUpdate', scores);
    } else {
      io.emit('newScene', scores);
    }



  });
});

server.listen(8081, function () {
  console.log(`Listening on ${server.address().port}`);
});
