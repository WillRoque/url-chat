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
    console.log('a user connected');

    socket.on('join room', (room) => {
        console.log('socket joining room ' + room);
        socket.join(room);
    });

    socket.on('chat message', (data) => {
        console.log(data);
        console.log('received message: ' + data.message);
        io.to(data.room).emit('chat message', data.message);
    });

    socket.on('disconnect', () => console.log('user disconnected'));
});

httpServer.listen(3000);