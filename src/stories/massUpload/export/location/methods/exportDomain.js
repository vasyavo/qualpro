const DomainModel = require('../../../../../types/domain/model');

function*  getDomainForExport() {
    const pipeLine = [{
        $lookup: {
            from        : 'domains',
            foreignField: '_id',
            localField  : 'parent',
            as          : 'parent'
        }
    }, {
        $unwind: {
            path                      : '$parent',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $addFields: {
            typePriority: {
                $cond: {
                    if  : {$eq: ['$type', 'country']},
                    then: 1,
                    else: {
                        $cond: {
                            if  : {$eq: ['$type', 'region']},
                            then: 2,
                            else: 3
                        }
                    }
                }
            }
        }
    }, {
        $sort: {
            typePriority: 1
        }
    }, {
        $project: {
            _id     : 0,
            id      : '$_id',
            enName  : {$toUpper: '$name.en'},
            arName  : {$toUpper: '$name.ar'},
            currency: {$toUpper: '$currency'},
            parent  : {
                $let: {
                    vars: {parentName: {$toUpper: '$parent.name.en'}},
                    in  : {
                        $cond: {
                            if  : {$eq: ['$$parentName', '']},
                            then: 'null',
                            else: '$$parentName'
                        }
                    }
                }
            },
            type    : {
                $cond: {
                    if  : {$eq: ['$type', 'subRegion']},
                    then: 'sub-region',
                    else: '$type'
                }
            }
        }
    }];

    return yield DomainModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getDomainForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
