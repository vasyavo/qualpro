var $ = require('jQuery');
var PubNub = require('./pubnub');

var state = {};

PubNub.client.addListener({
    message: function (data) {
        var channel = data.channel;
        var message = data.message;

        if (channel.length === 24) {
            var nextState = message.badgesState;

            Object.keys(nextState).forEach(function (prop) {
                if (nextState[prop] !== state[prop]) {
                    var count = nextState[prop];

                    state[prop] = count;
                    App.setMenuCount(prop, count);
                }
            });
        } else if (channel === App.currentDeviceChannel) {
            App.EventBus.trigger('import-finished', message);
        }
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

var cleanupCustomer = function() {
    request({
        moduleId: 4
    });
};

var cleanupTradeChannel = function() {
    request({
        moduleId: 5
    });
};

var cleanupPersonnel = function() {
    request({
        moduleId: 6
    });
};

var cleanupObjective = function() {
    request({
        moduleId: 7
    });
};

var cleanupInStoreReporting = function() {
    request({
        moduleId: 18
    });
};

var cleanupItemAndPrices = function() {
    request({
        moduleId: 10
    });
};

var cleanupPlanogram = function() {
    request({
        moduleId: 11
    });
};

var cleanupCompetitorList = function() {
    request({
        moduleId: 12
    });
};

var cleanupCompetitorPromoActivities = function() {
    request({
        moduleId: 32
    });
};

var cleanupPromoEvaluation = function() {
    request({
        moduleId: 33
    });
};

var cleanupCompetitorBrandingAndDisplay = function() {
    request({
        moduleId: 34
    });
};

var cleanupAchievementForm = function() {
    request({
        moduleId: 37
    });
};

var cleanupNewProductLaunch = function() {
    request({
        moduleId: 36
    });
};

var cleanupShelfShares = function() {
    request({
        moduleId: 39
    });
};

var cleanupPriceSurvey = function() {
    request({
        moduleId: 41
    });
};

var cleanupQuestionnaire = function() {
    request({
        moduleId: 31
    });
};

var cleanupMarketingCampaigns = function() {
    request({
        moduleId: 38
    });
};

var cleanupConsumerSurvey = function() {
    request({
        moduleId: 44
    });
};

var cleanupBrandingAndMonthlyDisplay = function() {
    request({
        moduleId: 45
    });
};

var cleanupContractsYearly = function() {
    request({
        moduleId: 20
    });
};

var cleanupContractsSecondary = function() {
    request({
        moduleId: 22
    });
};

var cleanupNotes = function() {
    request({
        moduleId: 25
    });
};

var cleanupNotifications = function() {
    request({
        moduleId: 26
    });
};

var cleanupDocuments = function() {
    request({
        moduleId: 42
    });
};

var cleanupContactUs = function() {
    request({
        moduleId: 43
    });
};

module.exports = {
    state,
    cleanupActivityList,

    cleanupCountries,
    cleanupCustomer,
    cleanupTradeChannel,

    cleanupPersonnel,
    cleanupObjective,
    cleanupInStoreReporting,
    cleanupItemAndPrices,
    cleanupPlanogram,
    cleanupCompetitorList,

    cleanupCompetitorPromoActivities,
    cleanupPromoEvaluation,
    cleanupCompetitorBrandingAndDisplay,
    cleanupAchievementForm,
    cleanupNewProductLaunch,
    cleanupShelfShares,
    cleanupPriceSurvey,

    cleanupQuestionnaire,
    cleanupMarketingCampaigns,
    cleanupConsumerSurvey,
    cleanupBrandingAndMonthlyDisplay,

    cleanupContractsYearly,
    cleanupContractsSecondary,

    cleanupNotes,
    cleanupNotifications,
    cleanupDocuments,
    cleanupContactUs
};
