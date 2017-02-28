define(function(require) {

    var PubNub = require('https://cdn.pubnub.com/sdk/javascript/pubnub.4.4.0.min.js');

    var client = new PubNub({
        subscribeKey: PUBNUB_SUBSCRIBE_KEY,
        ssl: true,
    });

    function subscribe(options) {
        var userId = options.userId;

        client.subscribe({
            channels: [userId],
        });
    }

    function unsubscribe(options) {
        var userId = options.userId;

        client.unsubscribe({
            channels: [userId]
        })
    }

    return {
        client: client,
        subscribe: subscribe,
        unsubscribe: unsubscribe
    };

});
