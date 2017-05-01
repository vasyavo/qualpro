const RetailSegment = require('../../../../../types/retailSegment/model');

function*  getRetailSegmentForExport() {
    const pipeLine = [{
        $project: {
            _id   : 0,
            id    : '$_id',
            enName: {$toUpper: '$name.en'},
            arName: '$name.ar'
        }
    }];

    return yield RetailSegment.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getRetailSegmentForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
