var MongoClient = require('mongodb').MongoClient;

module.exports.init = function (callback) {
    MongoClient.connect('mongodb://localhost:27017/url-chat', (err, db) => {
        module.exports.db = db;
        callback(err);
    });
}