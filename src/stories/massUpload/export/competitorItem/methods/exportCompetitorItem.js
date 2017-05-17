const CompetitorItemModel = require('../../../../../types/competitorItem/model');

function*  getCompetitiorItmesForExport() {
    const pipeLine = [{
        $match: {
            archived   : false,
            topArchived: false
        }
    }, {
        $lookup: {
            from        : 'origins',
            foreignField: '_id',
            localField  : 'origin',
            as          : 'origin'
        }
    }, {
        $unwind: {
            path                      : '$origin',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $lookup: {
            from        : 'brands',
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
        $lookup: {
            from        : 'competitorVariants',
            foreignField: '_id',
            localField  : 'variant',
            as          : 'variant'
        }
    }, {
        $unwind: {
            path                      : '$variant',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $lookup: {
            from        : 'domains',
            foreignField: '_id',
            localField  : 'country',
            as          : 'country'
        }
    }, {
        $unwind: {
            path                      : '$country',
            preserveNullAndEmptyArrays: true
        }
    }, {
        $project: {
            _id    : 0,
            id     : {$ifNull: ['$_id', '']},
            enName : {$ifNull: ['$name.en', '']},
            arName : {$ifNull: ['$name.ar', '']},
            size   : {$ifNull: ['$packing', '']},
            origin : {$ifNull: ['$origin.name.en', '']},
            brand  : {$ifNull: ['$brand.name.en', '']},
            variant: {$ifNull: ['$variant.name.en', '']},
            country: {$ifNull: ['$country.name.en', '']},
        }
    }];

    return yield CompetitorItemModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getCompetitiorItmesForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
