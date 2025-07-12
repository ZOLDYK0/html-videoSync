const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Room management
const rooms = {};
const users = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  users[socket.id] = { connected: true };

  socket.on('create_room', (data) => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      roomId,
      owner: socket.id,
      videoState: {
        url: '',
        playing: false,
        position: 0,
        lastUpdated: Date.now()
      },
      participants: {
        [socket.id]: {
          id: socket.id,
          username: data.username || 'Anonymous',
          isOwner: true
        }
      }
    };
    socket.join(roomId);
    socket.emit('room_created', rooms[roomId]);
  });

  socket.on('join_room', (data) => {
    const room = rooms[data.roomId];
    if (!room) {
      socket.emit('room_not_found');
      return;
    }

    room.participants[socket.id] = {
      id: socket.id,
      username: data.username || 'Anonymous',
      isOwner: false
    };
    socket.join(data.roomId);
    socket.emit('room_joined', {
      ...room,
      videoState: room.videoState
    });
    socket.to(data.roomId).emit('participant_joined', room.participants[socket.id]);
  });

  socket.on('update_video_state', (data) => {
    const room = rooms[data.roomId];
    if (!room) return;

    // Only allow owner to update video state
    if (room.owner !== socket.id) return;

    room.videoState = {
      url: data.url,
      playing: data.playing,
      position: data.position,
      lastUpdated: Date.now()
    };
    
    // Broadcast to all participants except sender
    socket.to(data.roomId).emit('video_state_update', room.videoState);
  });

  socket.on('request_sync', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    
    // Broadcast to room owner to send updated state
    socket.to(room.owner).emit('request_sync');
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    delete users[socket.id];
    for (const roomId in rooms) {
      if (rooms[roomId].owner === socket.id) {
        io.to(roomId).emit('room_closed');
        delete rooms[roomId];
      } else if (rooms[roomId].participants[socket.id]) {
        const username = rooms[roomId].participants[socket.id].username;
        delete rooms[roomId].participants[socket.id];
        io.to(roomId).emit('participant_left', socket.id);
        io.to(roomId).emit('show_toast', `${username} left`);
      }
    }
  });
});

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    rooms: Object.keys(rooms).length,
    users: Object.keys(users).length
  });
});

// All other routes to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
