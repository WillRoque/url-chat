var mongo = require('./mongodb.js');

module.exports.generateUserId = (callback) => {
    mongo.db.collection('users').insertOne({}, (err, result) => {
        if (err) {
            console.error(err);
        }

        callback(result.insertedId);
    });
}

module.exports.changeUserName = (socket, room, userId, userName) => {
    if (!userName || userName === '') {
        return;
    }

    mongo.db.collection('users').updateOne(
        { _id: mongo.ObjectId(userId) },
        { $set: { name: userName } },
        { $upsert: true },
        (err, result) => {
            if (err) {
                console.error(err);
            }
        }
    );

    socket.broadcast.to(room).emit('changeUserName', { user: { id: userId, name: userName } });
}