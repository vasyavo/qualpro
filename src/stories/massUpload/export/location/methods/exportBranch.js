const BranchModel = require('../../../../../types/branch/model');

function*  getBranchForExport() {
    const pipeLine = [{
        $match: {
            archived   : false,
            topArchived: false
        }
    }, {
        $lookup: {
            from        : 'domains',
            foreignField: '_id',
            localField  : 'subRegion',
            as          : 'subRegion'
        }
    }, {
        $unwind: {
            path                      : '$subRegion',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $lookup: {
            from        : 'retailSegments',
            foreignField: '_id',
            localField  : 'retailSegment',
            as          : 'retailSegment'
        }
    }, {
        $unwind: {
            path                      : '$retailSegment',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $lookup: {
            from        : 'outlets',
            foreignField: '_id',
            localField  : 'outlet',
            as          : 'outlet'
        }
    }, {
        $unwind: {
            path                      : '$outlet',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $project: {
            _id          : 0,
            id           : '$_id',
            enName       : {$toUpper: '$name.en'},
            arName       : '$name.ar',
            enAddress    : '$address.en',
            arAddress    : '$address.ar',
            subRegion    : {$toUpper: '$subRegion.name.en'},
            retailSegment: {$toUpper: '$retailSegment.name.en'},
            outlet       : {$toUpper: '$outlet.name.en'}
        }
    }];

    return yield BranchModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getBranchForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
