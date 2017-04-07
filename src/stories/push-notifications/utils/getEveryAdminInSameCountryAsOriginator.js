const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');
const accessRoles = require('./../../../constants/aclRolesNames');

const getEveryAdminInCountry = {
    $or: [{
        $setIsSubset: [['$$item.accessRole.level'], [
            accessRoles.MASTER_ADMIN,
            accessRoles.TRADE_MARKETER,
        ]],
    }, {
        $and: [{
            $setIsSubset: [['$$item.accessRole.level'], [
                accessRoles.COUNTRY_ADMIN,
                accessRoles.AREA_MANAGER,
                accessRoles.AREA_IN_CHARGE,
            ]],
        }, {
            $let: {
                vars: {
                    originatorCountry: {
                        $arrayElemAt: ['$actionOriginator.country', 0],
                    },
                    personnelCountry: {
                        $arrayElemAt: ['$$item.country', 0],
                    },
                },
                in: {
                    $or: [
                        {
                            $eq: ['$$originatorCountry', '$$personnelCountry'],
                        },
                        // if MA then originator country is null
                        {
                            $eq: ['$$originatorCountry', null],
                        },
                    ],
                },
            },
        }],
    }],
};

/*
 * @description Returns every admin in same location as action originator
 * @param {Object} options
 * @param {String} options.actionOriginator
 * @returns {String[]}
 * */

module.exports = function * (options) {
    const actionOriginator = ObjectId(options.actionOriginator);

    const pipeline = [{
        $project: {
            accessRole: 1,
            country: 1,
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
            actionOriginator: {
                $filter: {
                    input: '$setPersonnel',
                    as: 'item',
                    cond: {
                        $eq: ['$$item._id', actionOriginator],
                    },
                },
            },
        },
    }, {
        $unwind: {
            path: '$actionOriginator',
        },
    }, {
        $project: {
            setPersonnel: 1,
            actionOriginator: 1,
            setAdmin: {
                $filter: {
                    input: '$setPersonnel',
                    as: 'item',
                    cond: getEveryAdminInCountry,
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

