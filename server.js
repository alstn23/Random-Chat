require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const randomChatHandler = require('./sockets/randomChatHandler');

const app = express();
app.set('trust proxy', 1);

app.use(cookieParser());
app.use(express.json());

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many requests' }
});

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined.');
    process.exit(1);
}

app.post('/api/auth', authLimiter, (req, res) => {
    let token = req.cookies.authToken;
    
    if (!token) {
        const userId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
        token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '3d' });
        res.cookie('authToken', token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3 * 24 * 60 * 60 * 1000 });
        return res.json({ userId });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ userId: decoded.userId });
    } catch (err) {
        const userId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
        token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '3d' });
        res.cookie('authToken', token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 3 * 24 * 60 * 60 * 1000 });
        res.json({ userId });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 5e6
});

app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        let newPath = req.path.slice(0, -5);
        if (newPath === '/index') {
            newPath = '/';
        }
        const queryString = req.url.slice(req.path.length);
        return res.redirect(301, newPath + queryString);
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public'), {
    extensions: ['html']
}));

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let waitingUsers = [];
let userConnections = {};
let userRateLimits = {};

io.on('connection', (socket) => {
    socket.on('registerUser', () => {
        try {
            const cookieString = socket.handshake.headers.cookie || '';
            const match = cookieString.match(new RegExp('(^| )authToken=([^;]+)'));
            const token = match ? match[2] : null;

            if (!token) throw new Error('No token');
    
            const decoded = jwt.verify(token, JWT_SECRET);
            const userId = decoded.userId;

            if (!userRateLimits[userId]) {
                userRateLimits[userId] = { lastMessageType: null, imageTimestamps: [], penaltyUntil: 0 };
            }
            socket.rateLimitTracker = userRateLimits[userId];
            socket.userId = userId;
            socket.isDbAuthenticated = true;

            if (!userConnections[userId]) {
                userConnections[userId] = 0;
            }
            userConnections[userId]++;
            
            socket.emit('authSuccess');
        } catch (err) {
            socket.emit('authFailed');
            socket.disconnect();
        }
    });

    socket.blockedUsers = [];

    randomChatHandler(io, socket, waitingUsers, escapeHtml);

    socket.on('disconnect', () => {
        if (socket.userId && userConnections[socket.userId]) {
            userConnections[socket.userId]--;
            if (userConnections[socket.userId] === 0) {
                delete userConnections[socket.userId];
                delete userRateLimits[socket.userId];
            }
        }
        
        const waitIdx = waitingUsers.indexOf(socket);
        if (waitIdx !== -1) waitingUsers.splice(waitIdx, 1);
        
        if (socket.roomName) {
            socket.to(socket.roomName).emit('peerDisconnected');
        }
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});