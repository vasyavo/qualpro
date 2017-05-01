const PositionModel = require('../../../../../types/position/model');

function*  getPositionForExport() {
    const pipeLine = [{
        $project: {
            _id   : 0,
            id    : {$ifNull: ['$_id', '']},
            enName: {$ifNull: ['$name.en', '']},
            arName: {$ifNull: ['$name.ar', '']},
        }
    }];

    return yield PositionModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getPositionForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
