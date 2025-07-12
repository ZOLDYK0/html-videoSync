<<<<<<< HEAD
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// For any other route, serve index.html (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory storage for rooms
const rooms = {};

// Generate a unique room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new room
  socket.on('create_room', (data) => {
    const roomId = generateRoomId();
    const roomData = {
      roomId,
      owner: socket.id,
      videoState: data.videoState || {
        url: '',
        playing: false,
        position: 0
      },
      participants: {
        [socket.id]: {
          id: socket.id,
          username: data.username,
          isOwner: true
        }
      }
    };

    rooms[roomId] = roomData;
    socket.join(roomId);
    socket.emit('room_created', roomData);
  });

  // Join an existing room
  socket.on('join_room', (data) => {
    const roomId = data.roomId;
    const room = rooms[roomId];

    if (!room) {
      socket.emit('room_not_found');
      return;
    }

    // Add participant to room
    room.participants[socket.id] = {
      id: socket.id,
      username: data.username,
      isOwner: false
    };

    socket.join(roomId);
    socket.emit('room_joined', room);

    // Notify other participants
    socket.to(roomId).emit('participant_joined', {
      id: socket.id,
      username: data.username,
      isOwner: false
    });
  });

  // Update video state (only from owner)
  socket.on('update_video_state', (data) => {
    const room = rooms[data.roomId];
    if (!room || room.owner !== socket.id) return;

    // Update room state
    room.videoState = data.videoState;

    // Broadcast to all participants except sender
    socket.to(data.roomId).emit('video_state_update', data.videoState);
  });

  // Request sync from owner
  socket.on('request_sync', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    // Notify owner to broadcast current state
    io.to(room.owner).emit('sync_request');
  });

  // Leave room
  socket.on('leave_room', (data) => {
    const roomId = data.roomId;
    const room = rooms[roomId];
    if (!room) return;

    // Remove participant
    if (room.participants[data.userId]) {
      delete room.participants[data.userId];
      
      // Notify other participants
      socket.to(roomId).emit('participant_left', data.userId);
      
      // If owner leaves, close the room
      if (data.userId === room.owner) {
        io.to(roomId).emit('room_closed');
        delete rooms[roomId];
      }
    }
    
    socket.leave(roomId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find rooms the user was in and remove them
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.participants[socket.id]) {
        delete room.participants[socket.id];
        
        // Notify other participants
        io.to(roomId).emit('participant_left', socket.id);
        
        // If owner disconnects, close the room
        if (socket.id === room.owner) {
          io.to(roomId).emit('room_closed');
          delete rooms[roomId];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
=======
// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory storage for rooms
const rooms = {};

// Generate a unique room ID
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create a new room
  socket.on('create_room', (data) => {
    const roomId = generateRoomId();
    const roomData = {
      roomId,
      owner: socket.id,
      videoState: data.videoState || {
        url: '',
        playing: false,
        position: 0
      },
      participants: {
        [socket.id]: {
          id: socket.id,
          username: data.username,
          isOwner: true
        }
      }
    };

    rooms[roomId] = roomData;
    socket.join(roomId);
    socket.emit('room_created', roomData);
  });

  // Join an existing room
  socket.on('join_room', (data) => {
    const roomId = data.roomId;
    const room = rooms[roomId];

    if (!room) {
      socket.emit('room_not_found');
      return;
    }

    // Add participant to room
    room.participants[socket.id] = {
      id: socket.id,
      username: data.username,
      isOwner: false
    };

    socket.join(roomId);
    socket.emit('room_joined', room);

    // Notify other participants
    socket.to(roomId).emit('participant_joined', {
      id: socket.id,
      username: data.username,
      isOwner: false
    });
  });

  // Update video state (only from owner)
  socket.on('update_video_state', (data) => {
    const room = rooms[data.roomId];
    if (!room || room.owner !== socket.id) return;

    // Update room state
    room.videoState = data.videoState;

    // Broadcast to all participants except sender
    socket.to(data.roomId).emit('video_state_update', data.videoState);
  });

  // Request sync from owner
  socket.on('request_sync', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;

    // Notify owner to broadcast current state
    io.to(room.owner).emit('sync_request');
  });

  // Leave room
  socket.on('leave_room', (data) => {
    const roomId = data.roomId;
    const room = rooms[roomId];
    if (!room) return;

    // Remove participant
    if (room.participants[data.userId]) {
      delete room.participants[data.userId];
      
      // Notify other participants
      socket.to(roomId).emit('participant_left', data.userId);
      
      // If owner leaves, close the room
      if (data.userId === room.owner) {
        io.to(roomId).emit('room_closed');
        delete rooms[roomId];
      }
    }
    
    socket.leave(roomId);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find rooms the user was in and remove them
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.participants[socket.id]) {
        delete room.participants[socket.id];
        
        // Notify other participants
        io.to(roomId).emit('participant_left', socket.id);
        
        // If owner disconnects, close the room
        if (socket.id === room.owner) {
          io.to(roomId).emit('room_closed');
          delete rooms[roomId];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
>>>>>>> fda6b52 (Initial commit)
