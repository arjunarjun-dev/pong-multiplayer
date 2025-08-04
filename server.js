const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const games = {};

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  socket.on('joinGame', (gameId) => {
    console.log(`Player ${socket.id} joined game ${gameId}`);

    socket.join(gameId);

    if (!games[gameId]) {
      games[gameId] = [];
    }

    const players = games[gameId];

    // Prevent duplicate sockets in the array
    if (players.find(p => p.id === socket.id)) {
      // Already joined this game
      return;
    }

    if (players.length >= 2) {
      socket.emit('error', 'Game full');
      return;
    }

    players.push({ id: socket.id, socket: socket });

    // Notify all players in this game room how many players are connected
    io.to(gameId).emit('playerCount', players.length);

    if (players.length === 2) {
      console.log(`Starting game for room ${gameId}`);
      players[0].socket.emit('startOnlineGame', 'left');
      players[1].socket.emit('startOnlineGame', 'right');
    }

    socket.on('keydown', (key) => {
      socket.to(gameId).emit('keydown', key);
    });

    socket.on('keyup', (key) => {
      socket.to(gameId).emit('keyup', key);
    });

    socket.on('disconnect', () => {
      console.log(`Player ${socket.id} disconnected from game ${gameId}`);
      socket.leave(gameId);

      if (games[gameId]) {
        games[gameId] = games[gameId].filter(p => p.id !== socket.id);

        io.to(gameId).emit('playerCount', games[gameId].length);

        if (games[gameId].length === 0) {
          delete games[gameId];
          console.log(`Game ${gameId} deleted`);
        }
      }
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
