var express = require('express');
var http = require('http');
var path = require('path');
var crypto = require('crypto');
var mongo = require('./mongodb.js');

var app = express();
var httpServer = http.Server(app);
var io = require('socket.io')(httpServer);

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

io.on('connection', (socket) => {
    console.log('user connected');

    // Inserts an empty user to get the _id generated,
    // later on if the user decides to set a nick name,
    // this same object will be updated
    socket.on('generateUserId', (callback) => {
        mongo.db.collection('users').insertOne({}, (err, result) => {
            if (err) {
                console.error(err);
            }

            callback(result.insertedId);
        });
    });

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

mongo.init((err) => {
    if (err) {
        throw err;
    }

    httpServer.listen(3000, () => console.log('url-chat running on port ' + 3000))
});