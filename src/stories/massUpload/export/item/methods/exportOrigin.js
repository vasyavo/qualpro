const OriginModel = require('../../../../../types/origin/model');

function*  getOriginForExport() {
    const pipeLine = [{
        $sort: {
            'createdBy.date': 1
        }
    }, {
        $project: {
            _id   : 0,
            id    : {$ifNull: ['$_id', '']},
            enName: {$ifNull: ['$name.en', '']},
            arName: {$ifNull: ['$name.ar', '']}
        }
    }];

    return yield OriginModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getOriginForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
