const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Proxy endpoint to fetch any website
app.get('/proxy', async (req, res) => {
    try {
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        // Fetch the website content
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 10000,
            maxRedirects: 5
        });

        let html = response.data;
        
        // Fix relative URLs to absolute URLs
        const baseUrl = new URL(targetUrl).origin;
        html = html.replace(/href="\//g, `href="${baseUrl}/`);
        html = html.replace(/src="\//g, `src="${baseUrl}/`);
        html = html.replace(/action="\//g, `action="${baseUrl}/`);
        
        // Add base tag to handle remaining relative URLs
        html = html.replace('<head>', `<head><base href="${targetUrl}">`);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch website', 
            details: error.message 
        });
    }
});

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
