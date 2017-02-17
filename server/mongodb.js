var mongodb = require('mongodb');

/**
 * Connects to the database.
 * 
 * @param {function(string)} callback - lets the callback
 *   function know if some error occurred.
 */
module.exports.init = (callback) => {
    var user = process.env.MONGODB_USER;
    var password = process.env.MONGODB_PASSWORD;
    
    mongodb.MongoClient.connect('mongodb://' + user + ':' + password + '@localhost:27017/urlChat', (err, db) => {
        module.exports.db = db;
        module.exports.ObjectID = mongodb.ObjectID;

        callback(err);
    });
}
