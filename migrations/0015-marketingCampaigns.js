const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            db.renameCollection('brandingAndDisplay', 'marketingCampaign', cb);
        },

        (cb) => {
            db.renameCollection('brandingAndDisplayItems', 'marketingCampaignItem', cb);
        },

    ], next);
};

exports.down = function(db, next) {
    async.series([

        (cb) => {
            db.renameCollection('marketingCampaign', 'brandingAndDisplay', cb);
        },

        (cb) => {
            db.renameCollection('marketingCampaignItem', 'brandingAndDisplayItems', cb);
        },

    ], next);
};

