module.exports = function (socketIO, channel, message) {
    socketIO.of(channel).emit('chat message', message);
}