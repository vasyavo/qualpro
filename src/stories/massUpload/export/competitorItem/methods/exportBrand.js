const BrandModel = require('../../../../../types/brand/model');

function*  getBrandForExport() {
    const pipeLine = [{
        $match: {
            archived   : false,
            topArchived: false
        }
    }, {
        $project: {
            _id   : 0,
            id    : {$ifNull: ['$_id', '']},
            enName: {$ifNull: ['$name.en', '']},
            arName: {$ifNull: ['$name.ar', '']}
        }
    }];

    return yield BrandModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getBrandForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
