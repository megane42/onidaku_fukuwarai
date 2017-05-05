require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;

const ID = process.env.MONGO_ATLAS_ID;
const PW = process.env.MONGO_ATLAS_PW;
const NODE0 = 'cluster0-shard-00-00-sibms.mongodb.net:27017';
const NODE1 = 'cluster0-shard-00-01-sibms.mongodb.net:27017';
const NODE2 = 'cluster0-shard-00-02-sibms.mongodb.net:27017';
const DATABASE = 'onidaku_fukuwarai';
const COLLECTION = 'snapshot';
const OPTIONS = 'ssl=true&replicaSet=Cluster0-shard-0&authSource=admin';
const URL = 'mongodb://' + ID + ':' + PW + '@' + NODE0 + ',' + NODE1 + ',' + NODE2 + '/' + DATABASE + '?' + OPTIONS;

var mongo = {};

mongo.insertDocument = function(obj, callback) {
    MongoClient.connect(URL, function(err, db) {
        if (err !== null) {
            callback(err, null);
        } else {
            db.collection(COLLECTION).insert(obj, function(err, result) {
                callback(err, result);
                db.close();
            });
        }
    });
}

mongo.findDocumentByTimestamp = function(ts, callback) {
    MongoClient.connect(URL, function(err, db) {
        if (err !== null) {
            callback(err, null);
        } else {
            db.collection(COLLECTION).findOne({'timestamp': ts}, function(err, result) {
                callback(err, result);
                db.close();
            });
        }
    });
}

module.exports = mongo;

/* ------------------------------------------------------------

mongo = require('./mongo');
mongo.findDocumentByTimestamp(114514, function(err, result){
    if (err !== null) {
        console.log(err);
    } else {
        console.log(result);
    }
});

------------------------------------------------------------ */
