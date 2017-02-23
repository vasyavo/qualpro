define(function(require) {

    var PubNub = require('https://cdn.pubnub.com/sdk/javascript/pubnub.4.4.0.min.js');

    var client = new PubNub({
        subscribeKey: PUBNUB_SUBSCRIBE_KEY,
        ssl: true,
    });

    // badge number in Activity List
    client.addListener({
        message: function(data) {
            var nextState = data.message.badgesState;
            var previousState = App.badgesState || {};

            Object.keys(nextState).forEach(function(prop) {
                if (nextState[prop] !== previousState[prop]) {
                    var count = nextState[prop];

                    App.setMenuCount(prop, count);
                }
            });

            App.badgesState = nextState;
        },
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
