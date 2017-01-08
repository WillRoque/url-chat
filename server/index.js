var express = require('express');
var http = require('http');
var path = require('path');

var mongo = require('./mongodb.js');
var chat = require('./chat.js');
var user = require('./user.js');

var app = express();
var httpServer = http.Server(app);
var io = require('socket.io')(httpServer);

/**
 * Sets the path to the files to be served to the client.
 */
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Serves to the client the chat page.
 */
app.get('/', (req, res) => {
    res.sendFile('/index.html');
});

/**
 * The SocketIO methods used for the communication with the client.
 */
io.on('connection', (socket) => {

    /**
     * Generates an id to a new user.
     */
    socket.on('generateUserId', (callback) => {
        user.generateUserId(callback);
    });

    /**
     * Changes the name of a user.
     */
    socket.on('changeUserName', (data) => {
        user.changeUserName(socket, data.room, data.userId, data.userName);
    });

    /**
     * Inserts a user into a room.
     */
    socket.on('joinRoom', (room) => {
        chat.joinRoom(socket, room);
    });

    /**
     * Broadcasts a user's message to the other users in the same room.
     */
    socket.on('chatMessage', (data) => {
        chat.receiveChatMessage(socket, data.room, data.message, data.senderId, data.senderName);
    });

    /**
     * Loads older messages from the database and sends it back to the
     * socket that requested it.
     */
    socket.on('loadOlderMessages', (data) => {
        chat.getLastMessages(socket, data.room, data.oldestMessageTimestamp);
    });

    /**
     * Updates the user counter for other users when someone disconnects
     */
    socket.on('disconnecting', () => {
        chat.removeUserFromRoomCounter(socket);
    });
});

/**
 * Connects to the MongoDB and, if no error occurred, starts the server.
 */
mongo.init((err) => {
    if (err) {
        throw err;
    }

    httpServer.listen(3000, () => console.log('url-chat running on port ' + 3000))
});