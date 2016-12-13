var express = require('express');
var http = require('http');
var path = require('path');
var mongo = require('./mongodb.js');
var chat = require('./chat.js');

var app = express();
var httpServer = http.Server(app);
var io = require('socket.io')(httpServer);

/**
 * Sets the path to the files to be served to the client
 */
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Serves to the client the chat page
 */
app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

/**
 * The SocketIO methods used for the communication with the client
 */
io.on('connection', (socket) => {
    console.log('user connected');

    /**
     * Inserts an empty user to get the _id generated,
     * later on if the user decides to set a nick name,
     * this same object will be updated
     */
    socket.on('generateUserId', (callback) => {
        mongo.db.collection('users').insertOne({}, (err, result) => {
            if (err) {
                console.error(err);
            }

            callback(result.insertedId);
        });
    });

    /**
     * Inserts a user into a room
     */
    socket.on('joinRoom', (room) => {
        console.log('user joining room ' + room);
        socket.join(room);
    });

    /**
     * Broadcasts a user's message to the
     * other users in the same room
     */
    socket.on('chatMessage', (data) => {
        chat.receiveChatMessage(socket, data.room, data.message, data.sender);
    });

    /**
     * Disconnects a user
     */
    socket.on('disconnect', () => console.log('user disconnected'));
});

/**
 * Connects to the MongoDB, if no error occurred, starts the server
 */
mongo.init((err) => {
    if (err) {
        throw err;
    }

    httpServer.listen(3000, () => console.log('url-chat running on port ' + 3000))
});