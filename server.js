const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

let users = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining with a username
    socket.on('join', (username) => {
        users[socket.id] = { username, id: socket.id };
        console.log(`${username} joined with socket ID ${socket.id}`);
        
        // Broadcast the updated user list to all clients
        io.emit('update-users', Object.values(users));
    });

    // Handle WebRTC signaling
    socket.on('offer', (data) => {
        const { to, offer } = data;
        const toSocket = Object.keys(users).find(key => users[key].username === to);
        if (toSocket) {
            socket.to(toSocket).emit('offer', { from: users[socket.id].username, offer });
        }
    });

    socket.on('answer', (data) => {
        const { to, answer } = data;
        const toSocket = Object.keys(users).find(key => users[key].username === to);
        if (toSocket) {
            socket.to(toSocket).emit('answer', { from: users[socket.id].username, answer });
        }
    });

    socket.on('ice-candidate', (data) => {
        const { to, candidate } = data;
        const toSocket = Object.keys(users).find(key => users[key].username === to);
        if (toSocket) {
            socket.to(toSocket).emit('ice-candidate', { from: users[socket.id].username, candidate });
        }
    });

    // Handle call rejection
    socket.on('reject-call', (data) => {
        const { to } = data;
        const toSocket = Object.keys(users).find(key => users[key].username === to);
        if (toSocket) {
            socket.to(toSocket).emit('call-rejected', { from: users[socket.id].username });
        }
    });

    // Handle call hanging up
    socket.on('hang-up', (data) => {
        const { to } = data;
        const toSocket = Object.keys(users).find(key => users[key].username === to);
        if (toSocket) {
            socket.to(toSocket).emit('hang-up');
        }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete users[socket.id];
        
        // Broadcast the updated user list to all clients
        io.emit('update-users', Object.values(users));
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
