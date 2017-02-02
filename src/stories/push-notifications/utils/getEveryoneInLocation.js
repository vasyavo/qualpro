const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');
const accessRoles = require('./../../../constants/aclRolesNames');

/*
* @param {Object} options
* @param {String[]} options.setCountry
* @param {String[]} options.setRegion
* @param {String[]} options.setSubRegion
* @param {String[]} options.setOutlet
* @param {String[]} options.setBranch
* @returns {String[]}
* */

module.exports = function * (options) {
    const setExclude = options.exclude.map(id => ObjectId(id));
    const setCountry = options.setCountry.map(id => ObjectId(id));
    const setRegion = options.setRegion.map(id => ObjectId(id));
    const setSubRegion = options.setSubRegion.map(id => ObjectId(id));
    const setOutlet = options.setOutlet.map(id => ObjectId(id));
    const setBranch = options.setBranch.map(id => ObjectId(id));

    const pipeline = [{
        $project: {
            accessRole: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            outlet: 1,
            branch: 1,
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
        $match: {
            $or: [{
                'accessRole.level': {
                    $in: [
                        accessRoles.MASTER_ADMIN,
                        accessRoles.MASTER_UPLOADER,
                        accessRoles.TRADE_MARKETER,
                    ],
                },
            }, {
                'accessRole.level': {
                    $in: [
                        accessRoles.COUNTRY_ADMIN,
                        accessRoles.COUNTRY_UPLOADER,
                    ],
                },
                country: {
                    $in: setCountry,
                },
            }, {
                'accessRole.level': {
                    $in: [
                        accessRoles.AREA_MANAGER,
                    ],
                },
                region: {
                    $in: setRegion,
                },
            }, {
                'accessRole.level': {
                    $in: [
                        accessRoles.AREA_IN_CHARGE,
                    ],
                },
                setSubRegion: {
                    $in: setSubRegion,
                },
            }, {
                $and: [{
                    'accessRole.level': {
                        $in: [
                            accessRoles.SALES_MAN,
                            accessRoles.MERCHANDISER,
                            accessRoles.CASH_VAN,
                        ],
                    },
                }, {
                    $or: [{
                        outlet: {
                            $in: setOutlet,
                        },
                    }, {
                        branch: {
                            $in: setBranch,
                        },
                    }],
                }],
            }],
        },
    }, {
        $project: {
            _id: 1,
        },
    }, {
        $group: {
            _id: null,
            setInLocation: {
                $push: '$_id',
            },
        },
    }, {
        $project: {
            setInLocation: {
                $setDifference: ['$setInLocation', setExclude],
            },
        },
    }];

    const result = yield PersonnelModel.aggregate(pipeline).exec();
    const groups = result.length ? result : [{ setInLocation: [] }];
    const setInLocation = groups.slice()
        .pop()
        .setInLocation
        .map(objectId => objectId.toString());

    return setInLocation;
};

