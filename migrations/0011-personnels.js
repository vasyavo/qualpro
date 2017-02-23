const async = require('async');
const logger = require('./../src/utils/logger');
const trimObjectValues = require('./../src/stories/import/utils/trimObjectValues');
const readCsv = require('./../src/stories/import/utils/readCsv');

require('mongodb');

const dateQatarMassUpload = new Date('2017-02-18T21:00:00.000+0000');

exports.up = function(db, next) {
    async.waterfall([

        (cb) => {
            async.parallel({

                data: async.apply(readCsv, 'src/import/Feb_18_2017/Personnel.csv'),

                setSubRegion: (cb) => {
                    const query = {
                        'name.en': {
                            $in: [
                                'AL WAKRAH',
                                'UMM SALAL',
                                'DOHA',
                            ],
                        },
                        type: 'subRegion',
                    };

                    db.collection('domains').find(query).toArray(cb);
                },

                country: (cb) => {
                    const query = {
                        'name.en': 'QATAR',
                        type: 'country',
                    };

                    db.collection('domains').findOne(query, cb);
                },

            }, cb);
        },

        (options, cb) => {
            const {
                data,
                setSubRegion,
            } = options;
            const country = options.country || {};

            async.eachLimit(data, 10, (sourceObj, eachCb) => {
                const obj = trimObjectValues(sourceObj);
                const personnel = Object.assign({}, {
                    firstName: {
                        en: obj['First Name (EN)'].toUpperCase(),
                    },
                    lastName: {
                        en: obj['Last Name (EN)'].toUpperCase(),
                    },
                    branch: obj.Branch,
                });

                async.waterfall([

                    (cb) => {
                        const branches = personnel.branch
                            .split('|')
                            .map((branch) => (branch.trim()));
                        const query = {
                            'name.en': {
                                $in: branches,
                            },
                            subRegion: {
                                $in: setSubRegion.map(subRegion => subRegion._id),
                            },
                            // branches with same names are already exists before first Qatar mass upload
                            'createdBy.date': {
                                $gt: dateQatarMassUpload,
                            },
                        };

                        db.collection('branches').find(query).toArray(cb);
                    },

                    (branches, cb) => {
                        const query = {
                            'firstName.en': personnel.firstName.en,
                            'lastName.en': personnel.lastName.en,
                            country: [country._id],
                            archived: false,
                            /*
                            * would be a great to update only personnels
                            * from first Qatar mass upload
                            * but some of them without "createdBy.date"
                            *
                            * "createdBy.date": {
                            *    $gt: ISODate("2017-02-18T21:00:00.000+0000"),
                            * },
                            * */
                        };
                        const update = {
                            branch: branches.map(branch => branch._id),
                        };

                        logger.info('Migration:', {
                            personnel: `${query['firstName.en']} ${query['lastName.en']}`,
                            setBranch: update.branch.map(objectId => objectId.toString()),
                        });

                        db.collection('personnels').update(query, {
                            $set: update,
                        }, cb);
                    },

                ], eachCb);

            }, cb);
        },

    ], next);
};

exports.down = function(db, next) {
    next();
};
