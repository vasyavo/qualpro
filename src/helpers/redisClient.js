const client = require('./../utils/redisClient');

const writeToStorage = (key, value, exTime) => {
    if (exTime) {
        client.setex([key, exTime, value]);
    } else {
        client.set([key, value]);
    }
};
const writeToStorageHash = (key, field, value) => {
    client.hmset(key, field, value);
};
const getValuesStorageHash = (key, callback) => {
    client.hvals(key, callback);
};
const getValueHashByField = (key, field, callback) => {
    client.hget(key, field, callback);
};
const removeStorageHashByField = (key, field) => {
    client.hdel(key, field);
};
const incrementAndGet = (key, callback) => {
    client.incr(key, callback);
};
const readFromStorage = (key, callback) => {
    client.get(key, callback);
};
const removeFromStorage = (key) => {
    client.del(key, () => {});
};

module.exports = {
    redisClient: client,
    cacheStore: {
        incrementAndGet,
        writeToStorage,
        removeFromStorage,
        readFromStorage,
        writeToStorageHash,
        getValuesStorageHash,
        removeStorageHashByField,
        getValueHashByField,
    },
};
