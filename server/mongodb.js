var mongodb = require('mongodb');

/**
 * Connects to the database.
 * 
 * @param {function(string)} callback - lets the callback
 *   function know if some error occurred.
 */
module.exports.init = (callback) => {
    mongodb.MongoClient.connect('mongodb://localhost:27017/url-chat', (err, db) => {
        module.exports.db = db;
        module.exports.ObjectID = mongodb.ObjectID;

        callback(err);
    });
}