define(function(require) {

    var PubNub = require('https://cdn.pubnub.com/sdk/javascript/pubnub.4.4.0.min.js');

    var client = new PubNub({
        subscribeKey: PUBNUB_SUBSCRIBE_KEY,
        ssl: true,
    });

    // badge number in Activity List
    client.addListener({
        message: function(data) {
            var badge = data.message.badge;

            App.badge = badge;
            App.setMenuCount(1, badge);
        },
    });

    function subscribe(options) {
        var userId = options.userId;

        client.subscribe({
            channels: [userId],
        });
    }

    return {
        client: client,
        subscribe: subscribe,
    };

});
