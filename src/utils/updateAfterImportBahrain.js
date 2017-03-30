require('./../config');

const async = require('async');
const logger = require('./logger');
const DomainCollection = require('./../types/domain/collection');
const ItemCollection = require('./../types/item/collection');
const CompetitorItemCollection = require('./../types/competitorItem/collection');
const ActivityListCollection = require('./../types/activityList/collection');


async.watrefall([

    (cb) => {
        async.series({

            bahrainNew: (cb) => {
                DomainCollection.findOne({
                    'name.en': 'BAHRAIN',
                    archived: false,
                }, {
                    fields: {
                        _id: 1,
                        name: 1,
                    },
                }, cb);
            },

            bahrainDemo: (cb) => {
                DomainCollection.findOne({
                    'name.en': 'BAHRAIN',
                    archived: true,
                }, {
                    fields: {
                        _id: 1,
                        name: 1,
                    },
                }, cb);
            },

        }, cb);
    },

    (country, cb) => {
        const bahrainNewId = country.bahrainNew._id;
        const bahrainDemoId = country.bahrainDemo._id;

        async.series([

            (cb) => {
                DomainCollection.updateOne({
                    _id: bahrainNewId,
                }, {
                    $set: {
                        'name.en': 'BAHRAIN DEMO',
                    },
                }, cb);
            },

            (cb) => {
                ItemCollection.updateMany({
                    country: bahrainNewId,
                }, {
                    $set: {
                        country: bahrainDemoId,
                    },
                }, cb);
            },

            (cb) => {
                CompetitorItemCollection.updateMany({
                    country: bahrainNewId,
                }, {
                    $set: {
                        country: bahrainDemoId,
                    },
                }, cb);
            },

            (cb) => {
                ActivityListCollection.updateMany({
                    country: {
                        $in: [bahrainNewId],
                    },
                }, {
                    $set: {
                        country: [bahrainDemoId],
                    },
                }, cb);
            },

        ], cb);
    },

], (err) => {
    if (err) {
        logger.error(err);
        process.exit(1);
    }

    logger.info('Locations updated');
    process.exit(0);
});
