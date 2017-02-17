var mongo = require('./mongodb.js');

/**
 * Receives a chat message, broadcasts it to others
 * users in the same room and save it into the database.
 * Also deletes old messages from the database if there
 * are more than 250 stored.
 * 
 * @param socket - socket emitting this chat message.
 * @param room - room where the user that sent this chat message is in.
 * @param senderId - the id of the user that sent this chat message.
 * @param senderName - the name of the user that sent this chat message.
 */
module.exports.receiveChatMessage = (socket, room, message, senderId, senderName) => {
    var messageTimestamp = Date.now();

    socket.broadcast.to(room).emit('chatMessage', {
        sender: { id: senderId, name: senderName },
        message: message,
        timestamp: messageTimestamp
    });

    var chatRooms = mongo.db.collection('chatRooms');

    // Verifies if there are more than
    // 250 messages saved in this room
    // (the reason why it is 249 in the variable is because
    //  one message will be inserted at the end of this method)
    var messagesLimit = 249;

    // Finds how many messages are stored for this room
    chatRooms.aggregate([
        { $match: { room: room } },
        { $unwind: '$messages' },
        { $sort: { timestamp: 1 } },
        {
            $project: {
                senderId: '$messages.senderId',
                message: '$messages.message',
                timestamp: '$messages.timestamp'
            }
        }
    ], (err, result) => {
        if (err) {
            return console.error(err);
        }

        // Does nothing if the room is not yet in the database or
        // it is but the number messages don't exceed the limit
        if (!result || result.length === 0 || result.length <= messagesLimit) {
            return;
        }

        // Remove the exceeding old messages
        var exceeding = result.length - messagesLimit;
        var messagesToBeRemoved = result.slice(0, exceeding).map((message) => message.timestamp);

        // Translation to the query:
        // Removes messages where the timestamp is in the 'messagesToBeRemoved' array
        chatRooms.update({ room: room },
            { $pull: { messages: { timestamp: { $in: messagesToBeRemoved } } } }, (err) => {
                if (err) {
                    return console.error(err);
                }
            });
    });

    // Inserts this message into the database
    var message = {
        senderId: new mongo.ObjectID(senderId),
        message,
        timestamp: messageTimestamp
    };

    chatRooms.updateOne({ room: room },
        { $push: { messages: message } },
        { upsert: true },
        (err, result) => {
            if (err) {
                return console.error(err);
            }
        });
}

/**
 * Retrieves the last messages stored in the database
 * and sends it back to the client that requested it.
 * 
 * @param socket - the socket that sent this request.
 * @param room - the room where the messages are stored.
 * @param lastMessageTime - the timestamp of the last (newest) message to be
 *   retrieved, all the other messages retrieved will be older than this one.
 */
module.exports.getLastMessages = (socket, room, lastMessageTime) => {
    getLastMessages(room, lastMessageTime, 20, (err, result) => {
        if (err) {
            return console.error(err);
        }

        socket.emit('olderChatMessages', result);
    });
}

/**
 * Retrieves the last messages stored in the database.
 * 
 * @param room - the room where the messages are stored.
 * @param lastMessageTime - the timestamp of the last (newest) message to be
 *   retrieved, all the other messages retrieved will be older than this one.
 * @param messagesLimit - the number of messages to be retrieved.
 * @param {function(err, result)} callback - called when the query is done executing.
 */
function getLastMessages(room, lastMessageTime, messagesLimit, callback) {
    mongo.db.collection('chatRooms').aggregate([
        { $match: { room: room } },
        { $unwind: '$messages' },
        { $sort: { 'messages.timestamp': -1 } },
        { $match: { 'messages.timestamp': { $lt: lastMessageTime } } },
        { $limit: messagesLimit },
        {
            $lookup: {
                from: 'users',
                localField: 'messages.senderId',
                foreignField: '_id',
                as: 'users'
            }
        },
        { $sort: { 'messages.timestamp': 1 } },
        {
            $project: {
                _id: 0,
                sender: { id: '$messages.senderId', name: { $arrayElemAt: ['$users.name', 0] } },
                message: '$messages.message',
                timestamp: '$messages.timestamp'
            }
        }
    ], (err, result) => {
        if (err) {
            return callback(err);
        }

        callback(null, result);
    });
}

/**
 * Inserts a user into a room and updates the user counter
 * on the clients.
 * 
 * @param socket - socket of the user joining this room.
 * @param room - room to join.
 */
module.exports.joinRoom = (socket, room) => {
    socket.join(room, (err) => {
        if (err) {
            return console.error(err);
        }

        // Updates his own user counter and gets
        // the last messages sent to this room
        getLastMessages(room, Date.now(), 20, (err, result) => {
            if (err) {
                return console.error(err);
            }

            var data = {
                userCount: socket.adapter.rooms[room].length,
                messages: result
            };

            socket.emit('login', data);
        });

        // Updates the user counter to other users
        updateUserCounter(socket, room, socket.adapter.rooms[room].length);
    });
}

/**
 * Decreases the user counter by 1 on the clients that
 * are in the rooms that this user was. This method
 * should be called when a user is disconnecting.
 * 
 * @param socket - socket of the user who is disconnecting.
 */
module.exports.removeUserFromRoomCounter = (socket) => {
    for (roomName in socket.rooms) {
        // If the user is the only one in this room,
        // there is no need to update anyone else
        if (socket.adapter.rooms[roomName].length === 1) {
            continue;
        }

        updateUserCounter(socket, roomName, socket.adapter.rooms[roomName].length - 1);
    }
}

/**
 * Updates the user counter on the client.
 * 
 * @param socket - socket emitting this update.
 * @param room - name of the room to be updated.
 * @param userCount - the number of users currently in the room.
 */
function updateUserCounter(socket, room, userCount) {
    socket.broadcast.to(room).emit('updateUserCounter', { userCount: userCount });
}

/**
 * Notifies the other users in the room that this user is typing.
 * 
 * @param socket - socket of the user that is typing.
 * @param room - name of the room to be notified.
 * @param user - user who is typing.
 */
module.exports.notifyIsTyping = (socket, room, user) => {
    socket.broadcast.to(room).emit('typing', user);
}

/**
 * Notifies the other users in the room that this user has stopped typing.
 * 
 * @param socket - socket of the user that has stopped typing.
 * @param room - name of the room to be notified.
 * @param user - user who has stopped typing.
 */
module.exports.notifyStoppedTyping = (socket, room, user) => {
    socket.broadcast.to(room).emit('stoppedTyping', user);
}
