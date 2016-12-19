var mongodb = require('mongodb');

module.exports.init = function (callback) {
    mongodb.MongoClient.connect('mongodb://localhost:27017/url-chat', (err, db) => {
        module.exports.db = db;
        module.exports.ObjectId = mongodb.ObjectID;
        callback(err);
    });
}