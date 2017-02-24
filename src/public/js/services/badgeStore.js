define(function(require) {

    var $ = require('jQuery');
    var PubNub = require('services/pubnub');

    var state = {};

    PubNub.client.addListener({
        message: function(data) {
            var nextState = data.message.badgesState;

            Object.keys(nextState).forEach(function(prop) {
                if (nextState[prop] !== state[prop]) {
                    var count = nextState[prop];

                    state[prop] = count;
                    App.setMenuCount(prop, count);
                }
            });
        },
    });

    var request = function(options) {
        var moduleId = options.moduleId;

        $.ajax({
            url: '/activityList/badge',
            method: 'DELETE',
            dataType: 'json',
            data: {
                moduleId: moduleId,
            }
        });
    };

    var cleanupActivityList = function() {
        request({
            moduleId: 1
        });
    };

    var cleanupCountries = function() {
        request({
            moduleId: 3
        });
    };

    return {
        state,
        cleanupActivityList,
        cleanupCountries
    };

});
