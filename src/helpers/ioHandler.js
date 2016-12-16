module.exports = function(io, unreadCache) {
    "use strict";

    const _ = require('lodash');
    const async = require('async');
    const logger = require('../utils/logger');
    const logWriter = require('../helpers/logWriter.js');
    const MAIN_CONSTANTS = require('../constants/mainConstants.js');
    const actionKeyTemplate = _.template(MAIN_CONSTANTS.REDIS_ACTIONS_TEMPLATE_STRING);
    const redis = unreadCache.redis;
    const onlineKey = 'online';

    io.sockets.on('connection', function(socket) {
        console.log('----socket connected-----');

        socket.on('save_socket_connection', function(data) {
            var _this = this;
            var userId = data.uId;
            var actionKey = actionKeyTemplate({
                userId : userId,
                moduleId : 'alalali'
            });

            _this.uId = data.uId;
            unreadCache.setUserSocketId(data.uId, _this.id);
            redis.cacheStore.writeToStorageHash(onlineKey, _this.id, data.uId);

            socket.broadcast.to('online_status').emit('goOnline', {
                uid : _this.uId
            });

            redis.cacheStore.readFromStorage(actionKey, function(err, number) {
                if (err) {
                    return logger.error(err);
                }

                if (!number) {
                    number = 0
                }
                socket.emit('message', {badge : number});
            });

        });


        socket.on('subscribe_online_status', function() {
            socket.join('online_status');

            redis.cacheStore.getValuesStorageHash(onlineKey, function(err, online) {
                if (err) {
                    return logger.error(err);
                }

                socket.emit('online', {
                    online : _.uniq(online)
                });
            });
        });

        socket.on('logout', function() {
            const _this = this;

            redis.cacheStore.getValueHashByField(onlineKey, _this.id, function(err, uid) {
                if (err) {
                    return logger.error(err);
                }

                redis.cacheStore.removeStorageHashByField(onlineKey, _this.id);

                logger.info('----logout-----');
                socket.broadcast.to('online_status').emit('goOffline', {
                    uid
                });
            });
        });

        socket.on('unsubscribe_online_status', function() {
            socket.leave('online_status');
        });

        socket.on('disconnect', function() {
            const _this = this;

            redis.cacheStore.getValueHashByField(onlineKey, _this.id, function(err, uid) {
                if (err) {
                    return logger.error(err);
                }

                unreadCache.deleteUserSocketId(this.uId, this.id);
                redis.cacheStore.removeStorageHashByField(onlineKey, _this.id);

                logger.info('----socket disconnected-----');
                socket.broadcast.to('online_status').emit('goOffline', {
                    uid
                });
            });
        });
    });
};
