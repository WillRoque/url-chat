var mongo = require('./mongodb.js');

module.exports.receiveChatMessage = (socket, room, message, senderId, senderName) => {
    console.log('received message: ' + message);
    socket.broadcast.to(room).emit('chatMessage', {
        sender: { id: senderId, name: senderName },
        message: message
    });

    // Inserts this message and deletes old ones
    // to leave only 250 messages saved
    var message = {
        room,
        senderId,
        message
    };

    var chatRoom = mongo.db.collection('chatRoom');
    chatRoom.insertOne(message, (err, result) => {
        if (err) {
            console.error(err);
        }
    });

    // Verifies if there are more than 250 messages saved
    var messagesLimit = 250;

    chatRoom.count({}, (err, count) => {
        if (err) {
            return console.error(err);
        }

        // If there aren't more than 250 messages, do nothing
        if (messagesLimit - count >= 0) {
            return;
        }

        // TODO: test
        // Remove the exceeding old messages
        chatRoom.find({ room: room })
            .sort({ _id: 1 })
            .limit(messagesLimit - count)
            .project({ _id: 1 })
            .toArray((err, docs) => {
                if (err) {
                    return console.error(err);
                }

                docs = docs.map((doc) => doc._id);
                chatRoom.remove({ _id: { $in: docs } }, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
            });
    });
}