const socket = io();

// handle receiving player number (0 or 1)
socket.on('playerNumber', (number) => {
  console.log('You are Player', number);
  // assign to left or right paddle
});

// when moving paddle
document.addEventListener('keydown', function(e) {
  // send paddle position to server
  socket.emit('paddleMove', playerY);
});

// receive opponent paddle updates
socket.on('updateOpponent', (opponentY) => {
  // update opponent paddle position on screen
});

const restartBtn = document.getElementById('restartBtn');

restartBtn.addEventListener('click', () => {
  socket.emit('restartGame');  // Notify server to restart
});

socket.on('gameRestart', () => {
  // Reset game state on client: reset ball(s), scores, paddle positions etc.

  // Example reset code:
  balls = [{
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: grid,
    height: grid,
    dx: ballSpeed,
    dy: -ballSpeed,
    lastCloneTime: 0
  }];

  score1 = 0;
  score2 = 0;
  updateScore();

  leftPaddle.y = canvas.height / 2 - paddleHeight / 2;
  rightPaddle.y = canvas.height / 2 - paddleHeight / 2;
});

