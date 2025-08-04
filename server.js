const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Serve all files in the current directory (like index.html, game.js, etc.)
app.use(express.static(__dirname));

// Optional fallback for browser refresh
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Multiplayer game logic ---
const games = {};

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  socket.on('joinGame', (gameId) => {
    console.log(`Player ${socket.id} joined game ${gameId}`);

    socket.join(gameId); // Join room with name gameId

    if (!games[gameId]) {
      games[gameId] = [];
    }

    const players = games[gameId];

    // Avoid overfilling the game
    if (players.length >= 2) {
      socket.emit('error', 'Game full');
      return;
    }

    players.push(socket);

    // If both players joined, start the game
    if (players.length === 2) {
      players[0].emit('startOnlineGame', 'left');
      players[1].emit('startOnlineGame', 'right');
    }

    // Relay movement events
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
        games[gameId] = games[gameId].filter(s => s !== socket);

        // If no players left, delete the game room
        if (games[gameId].length === 0) {
          delete games[gameId];
        }
      }
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
