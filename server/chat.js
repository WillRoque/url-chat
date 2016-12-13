var mongo = require('./mongodb.js');

module.exports.receiveChatMessage = function (socket, room, message, sender) {
    console.log('received message: ' + message);
    socket.broadcast.to(room).emit('chatMessage', { sender: sender, message: message });

    // Inserts this message and deletes old ones
    // to leave only 250 messages saved
    var message = {
        sender,
        message
    };

    var chatRoom = mongo.db.collection('chatRoom');
    chatRoom.insertOne(message, (err, result) => {
        if (err) {
            console.error(err);
        }
    });
}