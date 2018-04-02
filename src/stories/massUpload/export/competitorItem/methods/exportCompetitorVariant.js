const CompetitorVariantModel = require('../../../../../types/competitorVariant/model');

function*  getCompetitorVariantForExport() {
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
    },  {
        $lookup: {
            from        : 'brand',
            foreignField: '_id',
            localField  : 'brand',
            as          : 'brand'
        }
    }, {
        $unwind: {
            path                      : '$brand',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $sort: {
            'createdBy.date': 1
        }
    }, {
        $project: {
            _id     : 0,
            id      : {$ifNull: ['$_id', '']},
            enName  : {$ifNull: ['$name.en', '']},
            arName  : {$ifNull: ['$name.ar', '']},
            category: {$ifNull: ['$category.name.en', '']},
            brand: {$ifNull: ['$brand.name.en', '']}
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
