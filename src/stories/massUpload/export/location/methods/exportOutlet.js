const OutletModel = require('../../../../../types/outlet/model');

function*  getOutletForExport() {
    const pipeLine = [{
        $match: {
            archived   : false,
            topArchived: false
        }
    }, {
        $sort: {
            'createdBy.date': 1
        }
    }, {
        $project: {
            _id   : 0,
            id    : '$_id',
            enName: {$toUpper: '$name.en'},
            arName: '$name.ar'
        }
    }];

    return yield OutletModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getOutletForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
