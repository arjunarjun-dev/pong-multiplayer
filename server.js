const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const grid = 15;
const paddleHeight = grid * 10;
const maxPaddleY = 585 - grid - paddleHeight;

let players = {}; // { socketId: { side: 'left'|'right', y, dy } }

function getPaddlePositions() {
  const positions = {};
  for (const id in players) {
    positions[players[id].side] = players[id].y;
  }
  return positions;
}

io.on('connection', socket => {
  console.log('New player connected:', socket.id);

  if (Object.keys(players).length >= 2) {
    socket.emit('roomFull');
    return;
  }

  // Assign side
  const side = Object.keys(players).length === 0 ? 'left' : 'right';
  players[socket.id] = { side: side, y: 0, dy: 0 };

  socket.emit('startOnlineGame', side);

  if (Object.keys(players).length === 2) {
    io.emit('gameStart'); // Notify both players game can start
  }

  socket.on('keydown', (key) => {
    const player = players[socket.id];
    if (!player) return;
    if ((player.side === 'left' && key === 'w') || (player.side === 'right' && key === 'ArrowUp')) {
      player.dy = -12;
    } else if ((player.side === 'left' && key === 's') || (player.side === 'right' && key === 'ArrowDown')) {
      player.dy = 12;
    }
  });

  socket.on('keyup', (key) => {
    const player = players[socket.id];
    if (!player) return;
    if ((player.side === 'left' && (key === 'w' || key === 's')) || (player.side === 'right' && (key === 'ArrowUp' || key === 'ArrowDown'))) {
      player.dy = 0;
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerLeft');
  });
});

// Update paddle positions 60fps and broadcast
setInterval(() => {
  for (const id in players) {
    const player = players[id];
    player.y += player.dy;
    player.y = Math.max(grid, Math.min(maxPaddleY, player.y));
  }
  io.emit('updatePaddles', getPaddlePositions());
}, 1000 / 60);

app.use(express.static(__dirname));
server.listen(3000, () => console.log('Server listening on port 3000'));
