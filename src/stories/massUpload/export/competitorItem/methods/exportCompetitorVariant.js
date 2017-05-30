const CompetitorVariantModel = require('../../../../../types/competitorVariant/model');

function*  getCompetitorVariantForExport() {
    const pipeLine = [{
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

    return yield CompetitorVariantModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getCompetitorVariantForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
