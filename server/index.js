var express = require('express');
var http = require('http');
var path = require('path');

var app = express();
var httpServer = http.Server(app);
var io = require('socket.io')(httpServer);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('joinRoom', (room) => {
        console.log('user joining room ' + room);
        socket.join(room);
    });

    socket.on('chatMessage', (data) => {
        console.log('received message: ' + data.message);
        socket.broadcast.to(data.room).emit('chatMessage', { sender: data.sender, message: data.message });
    });

    socket.on('disconnect', () => console.log('user disconnected'));
});

httpServer.listen(3000, () => console.log('url-chat running on port ' + 3000));