const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('player-move', (data) => {
    socket.broadcast.emit('player-move', { id: socket.id, ...data });
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    socket.broadcast.emit('player-disconnected', { id: socket.id });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
