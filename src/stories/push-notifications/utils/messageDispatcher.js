const async = require('async');
const redis = require('./../../../helpers/redisClient');

const getSocketIdByUserId = (userId, callback) => {
    const route = `socket_Uid:${userId}:*`;

    redis.redisClient.keys(route, callback);
};

class MessageDispatcher {

    static setIo(io) {
        this.io = io;
    }

    static sendMessage(options) {
        const {
            userId,
            data,
        } = options;

        return new Promise((resolve, reject) => {
            async.waterfall([

                async.apply(getSocketIdByUserId, userId),

                (arrayOfRedisKeys, cb) => {
                    const arrayOfPayload = arrayOfRedisKeys.map((redisKey) => {
                        const socketId = redisKey.split(':').pop();

                        return {
                            socketId,
                            data
                        }
                    });

                    async.each(arrayOfPayload, (payload, eachCb) => {
                        this.io.to(payload.socketId).emit('message', payload.data);
                        eachCb(null);
                    }, cb.bind(null, null, arrayOfPayload));
                }

            ], (err, data) => {
                if (err) {
                    return reject(err);
                }

                resolve(data);
            });
        });
    }

}

module.exports = MessageDispatcher;
