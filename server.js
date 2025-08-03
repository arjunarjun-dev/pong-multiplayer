const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {}; // gameId => [socketId1, socketId2]

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  socket.on('joinGame', (gameId) => {
    console.log(`${socket.id} wants to join game ${gameId}`);

    if (!rooms[gameId]) {
      rooms[gameId] = [];
    }

    const playersInRoom = rooms[gameId];

    if (playersInRoom.length >= 2) {
      // Room full
      socket.emit('roomFull');
      console.log(`Room ${gameId} is full`);
      return;
    }

    // Add player to room
    playersInRoom.push(socket.id);
    socket.join(gameId);
    console.log(`Player ${socket.id} joined room ${gameId}`);

    if (playersInRoom.length === 1) {
      // First player joined - tell them to wait
      socket.emit('waitingForPlayer');
    }

    if (playersInRoom.length === 2) {
      // Room full - start the game for both players
      const [player1, player2] = playersInRoom;

      io.to(player1).emit('startOnlineGame', 'left');
      io.to(player2).emit('startOnlineGame', 'right');

      console.log(`Game ${gameId} started with players ${player1} (left) and ${player2} (right)`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove player from any room
    for (const gameId in rooms) {
      const playersInRoom = rooms[gameId];
      const index = playersInRoom.indexOf(socket.id);
      if (index !== -1) {
        playersInRoom.splice(index, 1);
        // If room empty, delete it
        if (playersInRoom.length === 0) {
          delete rooms[gameId];
        }
        break;
      }
    }
  });

  // You can keep your other event handlers here (e.g. paddleMove, restartGame)...

  socket.on('paddleMove', (data) => {
    // broadcast the paddle movement to the opponent
    // 'data' should include gameId and y position for example
    if (data.gameId && data.y !== undefined) {
      socket.to(data.gameId).emit('updateOpponent', data.y);
    }
  });

  socket.on('restartGame', (gameId) => {
    if (gameId) {
      io.to(gameId).emit('gameRestart');
    }
  });
});

app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
