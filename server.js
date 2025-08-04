const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Serve all files in the current folder (like index.html, game.js, etc.)
app.use(express.static(__dirname));

// Optional fallback if no other route matches
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Multiplayer game logic ---
const games = {};

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  socket.on('joinGame', (gameId) => {
    console.log(`Player ${socket.id} joined game ${gameId}`);

    if (!games[gameId]) games[gameId] = [];

    const players = games[gameId];

    if (players.length >= 2) {
      socket.emit('error', 'Game full');
      return;
    }

    players.push(socket);

    if (players.length === 2) {
      players[0].emit('startOnlineGame', 'left');
      players[1].emit('startOnlineGame', 'right');
    }

    socket.on('keydown', (key) => {
      players.forEach(p => {
        if (p !== socket) p.emit('keydown', key);
      });
    });

    socket.on('keyup', (key) => {
      players.forEach(p => {
        if (p !== socket) p.emit('keyup', key);
      });
    });

    socket.on('disconnect', () => {
      console.log(`Player ${socket.id} disconnected`);
      if (games[gameId]) {
        games[gameId] = games[gameId].filter(s => s !== socket);
        if (games[gameId].length === 0) delete games[gameId];
      }
    });
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
