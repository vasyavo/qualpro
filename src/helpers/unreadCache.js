const redisClient = require('../helpers/redisClient');

function setUserSocketId(uId, socketId) {
    console.log('Saving user socket id: ' + uId + '=>' + socketId);
    redisClient.cacheStore.writeToStorage('socket_Uid:' + uId + ':' + socketId, socketId, '864000');
}

function getUserSocketId(uId, callback) {
    redisClient.cacheStore.readFromStorage('socket_Uid:' + uId, function(err, value) {
        if (err) {
            return callback(err, null);
        }
        callback(null, value);

    });
}

function deleteUserSocketId(uId, socketId) {
    redisClient.cacheStore.removeFromStorage('socket_Uid:' + uId + ':' + socketId, function(err) {
        if (err) {
            console.log(' ERRROR deleteUserSocketId')
        }
    });
}

function deleteAllUserSocketIds() {
    redisClient.cacheStore.removeFromStorage('socket_Uid:*', function(err) {
        if (err) {
            console.log(' ERRROR deleteUserSocketId')
        }
    });
}

module.exports = {
    redis: redisClient,
    setUserSocketId,
    getUserSocketId,
    deleteUserSocketId
};
