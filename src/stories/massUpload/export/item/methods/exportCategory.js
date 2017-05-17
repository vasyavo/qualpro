const CategoryModel = require('../../../../../types/category/model');

function* getCategoryForExport() {
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

    return yield CategoryModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getCategoryForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
