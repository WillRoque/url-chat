var mongo = require('./mongodb.js');

/**
 * Inserts an empty user into the database so it
 * generates and id, then calls the callback function
 * passing the generated Id as a parameter.
 * 
 * @param {function(string)} callback - returns the generated
 *   id to the client through this callback.
 */
module.exports.generateUserId = (callback) => {
    mongo.db.collection('users').insertOne({}, (err, result) => {
        if (err) {
            return console.error(err);
        }

        callback(result.insertedId);
    });
}

/**
 * Changes the name of the user in the database and
 * also broadcasts the change to notify other clients.
 * 
 * @param socket - socket emitting this name change.
 * @param room - room where the user that is changing his name is in.
 * @param userId - the id of the user that is changing his name.
 * @param userName - the new name of the user.
 */
module.exports.changeUserName = (socket, room, userId, userName) => {
    if (!userName || userName === '') {
        return;
    }

    mongo.db.collection('users').updateOne(
        { _id: mongo.ObjectID(userId) },
        { $set: { name: userName } },
        { $upsert: true },
        (err, result) => {
            if (err) {
                return console.error(err);
            }
        }
    );

    socket.broadcast.to(room).emit('changeUserName', { user: { id: userId, name: userName } });
}