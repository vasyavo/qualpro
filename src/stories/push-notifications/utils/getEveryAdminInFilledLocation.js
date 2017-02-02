const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');
const getEveryAdminIn = require('./conditions/getEveryAdminIn');

/*
 * @description Returns every admin in filled location
 * @param {Object} options
 * @param {String[]} options.setCountry
 * @param {String[]} options.setRegion
 * @param {String[]} options.setSubRegion
 * @returns {String[]}
 * */

module.exports = function * (options) {
    const setCountry = ObjectId(options.setCountry);
    const setRegion = ObjectId(options.setRegion);
    const setSubRegion = ObjectId(options.setSubRegion);
    const condition = {};

    if (setCountry.length && setRegion.length && setSubRegion.length) {
        condition.$or = getEveryAdminIn.subRegion.$or;
    } else if (setCountry.length && setRegion.length) {
        condition.$or = getEveryAdminIn.region.$or;
    } else if (setCountry.length) {
        condition.$or = getEveryAdminIn.country.$or;
    }

    const pipeline = [{
        $project: {
            accessRole: 1,
            country: 1,
            region: 1,
            subRegion: 1,
        },
    }, {
        $lookup: {
            from: 'accessRoles',
            localField: 'accessRole',
            foreignField: '_id',
            as: 'accessRole',
        },
    }, {
        $unwind: {
            path: '$accessRole',
        },
    }, {
        $group: {
            _id: null,
            setPersonnel: { $push: '$$ROOT' },
        },
    }, {
        $project: {
            setPersonnel: 1,
            setAdmin: {
                $let: {
                    vars: {
                        setCountry,
                        setRegion,
                        setSubRegion,
                    },
                    in: {
                        $filter: {
                            input: '$setPersonnel',
                            as: 'item',
                            cond: condition,
                        },
                    },
                },
            },
        },
    }, {
        $project: {
            setAdmin: '$setAdmin._id',
        },
    }];

    const result = yield PersonnelModel.aggregate(pipeline).exec();
    const setAdmin = result.slice()
        .pop()
        .setAdmin
        .filter(objectId => objectId)
        .map(objectId => objectId.toString());

    return setAdmin;
};

