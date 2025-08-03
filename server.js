const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = {};

io.on('connection', socket => {
  console.log('New player connected:', socket.id);

  if (Object.keys(players).length < 2) {
    players[socket.id] = { y: 0 };
  }

  socket.emit('playerNumber', Object.keys(players).indexOf(socket.id));

  socket.on('restartGame', () => {
  // Broadcast restart to all connected clients
  io.emit('gameRestart');
});

  socket.on('paddleMove', y => {
    if (players[socket.id]) {
      players[socket.id].y = y;
      socket.broadcast.emit('updateOpponent', y);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    console.log('Player disconnected:', socket.id);
  });
});

app.use(express.static(__dirname));
server.listen(3000, () => console.log('Server listening on port 3000'));

