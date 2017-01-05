const async = require('async');
const Bluebird = require('bluebird');
const redis = require('./../../../helpers/redisClient');

const getSocketIdByUserId = (userId, callback) => {
    const route = `socket_Uid:${userId}:*`;

    redis.redisClient.keys(route, callback);
};

class MessageDispatcher {

    static setIo(io) {
        this.io = io;
    }

    static sendMessage(groups, callback) {
        const itRecipient = (action) => {
            return (recipient, itCallback) => {
                async.waterfall([

                    async.apply(getSocketIdByUserId, recipient),

                    (arrayOfRedisKeys, cb) => {
                        const arrayOfSocketId = arrayOfRedisKeys.map((redisKey) => {
                            const socketId = redisKey.split(':')[2];

                            return socketId
                        });

                        async.each(arrayOfSocketId, (socketId, eachCb) => {
                            this.io.to(socketId).emit('message', action.payload);
                            eachCb(null);
                        }, cb.bind(null, null, arrayOfSocketId));
                    },

                ], itCallback);
            };
        };

        const itGroup = (group, itCallback) => {
            const {
                recipients,
                payload,
            } = group;
            const action = {
                payload
            };

            async.each(recipients, itRecipient(action), itCallback);
        };

        async.each(groups, itGroup, callback);
    }

}

MessageDispatcher.sendMessage = Bluebird.promisify(MessageDispatcher.sendMessage);

module.exports = MessageDispatcher;
