const async = require('async');
const Bluebird = require('bluebird');
const redis = require('./../../../helpers/redisClient');
const addAction = require('./../utils/addAction');

const getSocketIdByUserId = (userId, callback) => {
    const route = `socket_Uid:${userId}:*`;

    redis.redisClient.keys(route, callback);
};

class MessageDispatcher {

    static setIo(io) {
        this.io = io;
    }

    /*
     * @param {Object[]} groups
     * @param {String[]} groups.recipient set of user ID
     * @param {Object} groups.subject
     * @param {String} groups.subject.en
     * @param {String} groups.subject.ar
     * @param {Object} groups.payload
     * */
    static sendMessage(groups, callback) {
        /*
         * @param {Object} action
         * @param {Object} action.payload
         * */
        const itRecipient = (action) => {
            return (recipient, itCallback) => {
                async.parallel({

                    numberOfNewActivities: async.apply(addAction, recipient),

                    setRedisKeys: async.apply(getSocketIdByUserId, recipient),

                }, (err, values) => {
                    if (err) {
                        return itCallback(err);
                    }

                    const {
                        numberOfNewActivities,
                        setRedisKeys
                    } = values;

                    async.each(setRedisKeys, (redisKey, eachCb) => {
                        const socketId = redisKey.split(':')[2];
                        const payload = Object.assign({}, action.paylaod, {
                            badge: numberOfNewActivities,
                        });

                        this.io.to(socketId).emit('message', payload);
                        eachCb(null);
                    }, itCallback);
                });
            }
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
