const config = require('./../config');
const redis = require('redis');
const socketIo = require('socket.io');
const redisAdapter = require('socket.io-redis');
const unreadCache = require('./unreadCache');

module.exports = (options) => {
    const {
        server,
        port,
    } = options;

    function onError(err) {
        if (err) {
            console.log(err.message || err);
        }
    }

    const redisOptions = { return_buffers: true };
    const pub = redis.createClient(config.redisUrl, redisOptions);
    const sub = redis.createClient(config.redisUrl, redisOptions);

    const io = socketIo();

    io.listen(server || port);

    io.set('transports', [
        'websocket',
    ]);

    io.adapter(redisAdapter(config.redisUrl, {
        pubClient: pub,
        subClient: sub
    }));

    pub.on('error', onError);
    sub.on('error', onError);
    require('./ioHandler')(io, unreadCache);

    return io;
};
