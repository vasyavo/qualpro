var PubNub = require('pubnub');
var App = require('../appState');

var client = new PubNub({
    subscribeKey: PUBNUB_SUBSCRIBE_KEY,
    ssl         : true,
});

function subscribe(options) {
    var userId = options.userId;
    App.currentDeviceChannel = userId + '-' + Date.now() + '-' + Math.round(Math.random() * 100000);

    client.subscribe({
        channels: [App.currentDeviceChannel, userId],
    });
}

function unsubscribe(options) {
    var userId = options.userId;

    client.unsubscribe({
        channels: [App.currentDeviceChannel, userId]
    })
}

module.exports = {
    client               : client,
    subscribe            : subscribe,
    unsubscribe          : unsubscribe
};
