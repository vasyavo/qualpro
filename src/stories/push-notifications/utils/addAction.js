const cacheStore = require('./../../../helpers/redisClient').cacheStore;
const actionKeyPrefix = 'actions';

/*
* @param {String} userId
* */
module.exports = (userId, callback) => {
    const actionKey = `${actionKeyPrefix}:${userId}`;

    cacheStore.incrementAndGet(actionKey, (err, number) => {
        if (err) {
            return callback(err);
        }

        if (!number) {
            number = 0;
        }

        callback(null, number);
    });
};
