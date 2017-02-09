const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');
const accessRoles = require('./../../../constants/aclRolesNames');

/*
 * @param {Object} options
 * @param {String[]} options.setCountry
 * @returns {String[]}
 * */

module.exports = function * (options) {
    const setCountry = options.setCountry.map(id => ObjectId(id));

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
        $project: {
            'accessRole.level': 1,
            country: 1,
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
                        accessRoles.AREA_MANAGER,
                        accessRoles.AREA_IN_CHARGE,
                        accessRoles.SALES_MAN,
                        accessRoles.MERCHANDISER,
                        accessRoles.CASH_VAN,
                    ],
                },
                country: {
                    $in: setCountry,
                },
            }],
        },
    }, {
        $group: {
            _id: null,
            setInLocation: {
                $push: '$_id',
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
