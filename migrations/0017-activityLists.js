const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('activityLists').update({
                        itemType: 'brandingActivity',
                    }, {
                        $set: {
                            itemType: 'marketingCampaign',
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('activityLists').update({
                        itemType: 'brandingActivityItems',
                    }, {
                        $set: {
                            itemType: 'marketingCampaignItem',
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('activityLists').update({
                        itemType: 'brandingAndDisplayNew',
                    }, {
                        $set: {
                            itemType: 'brandingAndMonthlyDisplay',
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

    ], next);
};

exports.down = function(db, next) {
    async.series([

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('activityLists').update({
                        itemType: 'marketingCampaign',
                    }, {
                        $set: {
                            itemType: 'brandingActivity',
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('activityLists').update({
                        itemType: 'marketingCampaignItem',
                    }, {
                        $set: {
                            itemType: 'brandingActivityItems',
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

        (cb) => {
            async.parallel([

                (cb) => {
                    db.collection('activityLists').update({
                        itemType: 'brandingAndMonthlyDisplay',
                    }, {
                        $set: {
                            itemType: 'brandingAndDisplayNew',
                        },
                    }, {
                        multi: true,
                    }, cb);
                },

            ], cb);
        },

    ], next);
};
