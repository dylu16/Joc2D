var Game = new Phaser.Scene('Game');
var Win = new Phaser.Scene('Win');

Game.preload = function() {
  this.load.image('ship', 'nave/ship1.png');
  this.load.image('otherPlayer', 'nave/ship2.png');
  this.load.image('star', 'nave/star.png');
}

Game.create = function() {
  var self = this;
  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });
  this.cursors = this.input.keyboard.createCursorKeys();

  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
  
  this.socket.on('scoreUpdate', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);


  });

  this.socket.on('newScene', function (scores){
    self.scene.start('Win', scores);
  });


  this.socket.on('starLocation', function (starLocation) {
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
    self.physics.add.overlap(self.ship, self.star, function () {
      this.socket.emit('starCollected');
    }, null, self);
  });
}

Game.update = function() {
  if (this.ship) {
    if (this.cursors.left.isDown) {
      this.ship.setAngularVelocity(-150);
    } else if (this.cursors.right.isDown) {
      this.ship.setAngularVelocity(150);
    } else {
      this.ship.setAngularVelocity(0);
    }
  
    if (this.cursors.up.isDown) {
      this.physics.velocityFromRotation(this.ship.rotation + 1.5, 100, this.ship.body.acceleration);
    } else {
      this.ship.setAcceleration(0);
    }
  
    this.physics.world.wrap(this.ship, 5);

    // miscarea jucatorului
    var x = this.ship.x;
    var y = this.ship.y;
    var r = this.ship.rotation;
    if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
    }
    // salvare date pozitie veche
    this.ship.oldPosition = {
      x: this.ship.x,
      y: this.ship.y,
      rotation: this.ship.rotation
    };
  }
}

Win.preload = function() {
    this.load.atlas('lazer1', 'assets/lazer1.png', 'assets/lazer.json');
    this.load.atlas('lazer2', 'assets/lazer2.png', 'assets/lazer.json');
  
 }


Win.create = function(scores) {
  
  var group = this.add.group();

  if (scores.red >= 20){
    this.anims.create({ key: 'blast', frames: this.anims.generateFrameNames('lazer1', { prefix: 'lazer_', start: 0, end: 22, zeroPad: 2 }), repeat: -1 });
  } else {
    this.anims.create({ key: 'blast', frames: this.anims.generateFrameNames('lazer2', { prefix: 'lazer_', start: 0, end: 22, zeroPad: 2 }), repeat: -1 }); 
  }

  group.createMultiple({ key: 'lazer1', frame: 'lazer_22', repeat: 39, setScale: { x: 0.25, y: 0.25 } });

  Phaser.Actions.GridAlign(group.getChildren(), {
    width: 20,
    height: 2,
    cellWidth: 32,
    cellHeight: 280,
    x: -50,
    y: -220
  });
  this.anims.staggerPlay('blast', group.getChildren(), 0.3);
}


var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: { y: 0 }
      }
    },
    scene: [ Game, Win ]
};

var game = new Phaser.Game(config);

function addPlayer(self, playerInfo) {
    self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
      self.ship.setTint(0x0000ff);
    } else {
      self.ship.setTint(0xff0000);
    }
    self.ship.setDrag(100);
    self.ship.setAngularDrag(100);
    self.ship.setMaxVelocity(200);
  }
  
  function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
      otherPlayer.setTint(0x0000ff);
    } else {
      otherPlayer.setTint(0xff0000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
  }
