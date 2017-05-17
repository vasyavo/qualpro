const VariantModel = require('../../../../../types/variant/model');

function*  getVariantForExport() {
    const pipeLine = [{
        $match: {
            archived   : false,
            topArchived: false
        }
    }, {
        $lookup: {
            from        : 'categories',
            foreignField: '_id',
            localField  : 'category',
            as          : 'category'
        }
    }, {
        $unwind: {
            path                      : '$category',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $project: {
            _id     : 0,
            id      : {$ifNull: ['$_id', '']},
            enName  : {$ifNull: ['$name.en', '']},
            arName  : {$ifNull: ['$name.ar', '']},
            category: {$ifNull: ['$category.name.en', '']}
        }
    }];

    return yield VariantModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getVariantForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
