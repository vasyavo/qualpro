module.exports = function (io, unreadCache) {
    "use strict";

    var _ = require('lodash');
    var logWriter = require('../helpers/logWriter.js');
    var MAIN_CONSTANTS = require('../constants/mainConstants.js');
    var actionKeyTemplate = _.template(MAIN_CONSTANTS.REDIS_ACTIONS_TEMPLATE_STRING);
    var redis = unreadCache.redis;

    io.sockets.on('connection', function (socket) {
        console.log('----socket connected-----');

        socket.on('save_socket_connection', function (data) {
            var that = this;
            var userId = data.uId;
            var actionKey = actionKeyTemplate({userId: userId, moduleId: 'alalali'});

            that.uId = data.uId;
            unreadCache.setUserSocketId(data.uId, that.id);

            redis.cacheStore.readFromStorage(actionKey, function (err, number) {
                if (err) {
                    return next(err);
                }

                if (!number) {
                    number = 0
                }
                socket.emit('message', {badge: number});
            });

        });

        socket.on('disconnect', function () {
            console.log('disconnect');
            unreadCache.deleteUserSocketId(this.uId, this.id);
        });
    });
};
