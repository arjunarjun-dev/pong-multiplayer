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

