const PersonnelModel = require('../../../../../types/personnel/model');

function*  getPositionForExport() {
    const pipeLine = [{
        $match: {
            archived: false
        }
    }, {
        $lookup: {
            from        : 'domains',
            foreignField: '_id',
            localField  : 'country',
            as          : 'country'
        }
    }, {
        $lookup: {
            from        : 'domains',
            foreignField: '_id',
            localField  : 'region',
            as          : 'region'
        }
    }, {
        $lookup: {
            from        : 'domains',
            foreignField: '_id',
            localField  : 'subRegion',
            as          : 'subRegion'
        }
    }, {
        $lookup: {
            from        : 'branches',
            foreignField: '_id',
            localField  : 'branch',
            as          : 'branch'
        }
    }, {
        $lookup: {
            from        : 'personnels',
            foreignField: '_id',
            localField  : 'manager',
            as          : 'manager'
        }
    }, {
        $unwind: {
            path                      : '$manager',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $lookup: {
            from        : 'accessRoles',
            foreignField: '_id',
            localField  : 'accessRole',
            as          : 'accessRole'
        }
    }, {
        $unwind: {
            path                      : '$accessRole',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $lookup: {
            from        : 'positions',
            foreignField: '_id',
            localField  : 'position',
            as          : 'position'
        }
    }, {
        $unwind: {
            path                      : '$position',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $sort: {
            'createdBy.date': 1
        }
    }, {
        $project: {
            _id        : 0,
            id         : {$ifNull: ['$_id', '']},
            enFirstName: {$ifNull: ['$firstName.en', '']},
            arFirstName: {$ifNull: ['$firstName.ar', '']},
            enLastName : {$ifNull: ['$lastName.en', '']},
            arLastName : {$ifNull: ['$lastName.ar', '']},
            email      : {$ifNull: ['$email', '']},
            phoneNumber: {$ifNull: ['$phoneNumber', '']},
            dateJoined : {$ifNull: ['$dateJoined', '']},
            accessRole : {$ifNull: ['$accessRole.name.en', '']},
            position   : {$ifNull: ['$position.name.en', '']},

            manager: {
                $cond: {
                    if  : {$gt: ['$manager._id', '']},
                    then: {
                        $cond: {
                            if  : {$gt: ['$manager.email', '']},
                            then: '$manager.email',
                            else: '$manager.phoneNumber'
                        }
                    },

                    else: ''
                }
            },

            country: {
                $map: {
                    input: '$country',
                    as   : 'item',
                    in   : '$$item.name.en'
                }
            },

            region: {
                $map: {
                    input: '$region',
                    as   : 'item',
                    in   : '$$item.name.en'
                }
            },

            subRegion: {
                $map: {
                    input: '$subRegion',
                    as   : 'item',
                    in   : '$$item.name.en'
                }
            },

            branch: {
                $map: {
                    input: '$branch',
                    as   : 'item',
                    in   : '$$item.name.en'
                }
            }
        }
    }];

    return yield PersonnelModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getPositionForExport();
    } catch (ex) {
        throw ex;
    }

    result = result.map(el => {
        el.country = el.country.join(', ');
        el.region = el.region.join(', ');
        el.subRegion = el.subRegion.join(', ');
        el.branch = el.branch.join(', ');

        return el;
    });

    return result;
};
