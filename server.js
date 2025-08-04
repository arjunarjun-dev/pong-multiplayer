// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const games = {};

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  socket.on('joinGame', (gameId) => {
    console.log(`Player ${socket.id} joined game ${gameId}`);
    
    if (!games[gameId]) {
      games[gameId] = [];
    }

    const players = games[gameId];

    if (players.length >= 2) {
      socket.emit('error', 'Game full');
      return;
    }

    players.push(socket);

    if (players.length === 2) {
      console.log(`Starting game ${gameId}`);
      players[0].emit('startOnlineGame', 'left');
      players[1].emit('startOnlineGame', 'right');
    }

    // Relay paddle movement events
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
        if (games[gameId].length === 0) {
          delete games[gameId];
        }
      }
    });
  });
});

server.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
