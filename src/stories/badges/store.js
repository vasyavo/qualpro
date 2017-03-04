const async = require('async');
const client = require('./../../utils/redisClient');
const reducer = require('./reducer');

/*
* @description Persist state to Redis
* @param {String} address
* @param {Object} state
* @param {Function} callback
* */
const persist = (address, state) => {
    client.hmset(address, state);
};

const rehydrate = (address, callback) => {
    client.hgetall(address, callback);
};

const dispatch = (action, callback) => {
    const { address } = action.payload;

    async.waterfall([

        (cb) => {
            rehydrate(address, cb);
        },

        (state, cb) => {
            const nextState = reducer(state, action);

            persist(address, nextState);

            cb(null, nextState);
        },

    ], callback);
};

module.exports = {
    persist,
    rehydrate,
    dispatch,
};
