var express = require('express');
var http = require('http');
var path = require('path');

var app = express();
var httpServer = http.Server(app);
var io = require('socket.io')(httpServer);

app.get('/', (req, res) => {
    res.sendFile('/html/index.html', { root: path.join(__dirname, '../public') });
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', (msg) => io.emit('chat message', msg));
    socket.on('disconnect', () => console.log('user disconnected'));
});

httpServer.listen(3000);