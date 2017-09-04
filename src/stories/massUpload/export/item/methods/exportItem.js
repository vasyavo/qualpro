const ItemModel = require('../../../../../types/item/model');

function*  getItemForExport() {
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
        $lookup: {
            from        : 'variants',
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
        $sort: {
            'createdBy.date': 1
        }
    }, {
        $project: {
            _id       : 0,
            id        : {$ifNull: ['$_id', '']},
            enName    : {$ifNull: ['$name.en', '']},
            arName    : {$ifNull: ['$name.ar', '']},
            packing   : {$ifNull: ['$packing', '']},
            barcode   : {$ifNull: ['$barCode', '']},
            ppt       : {$divide: [{$ifNull: ['$ppt', 0]}, 1000]},
            pptPerCase: {$divide: [{$ifNull: ['$pptPerCase', 0]}, 1000]},
            rspMin    : {$divide: [{$ifNull: ['$rspMin', 0]}, 1000]},
            rspMax    : {$divide: [{$ifNull: ['$rspMax', 0]}, 1000]},
            origin    : {$ifNull: ['$origin.name.en', '']},
            category  : {$ifNull: ['$category.name.en', '']},
            variant   : {$ifNull: ['$variant.name.en', '']},
            country   : {$ifNull: ['$country.name.en', '']},
        }
    }];

    return yield ItemModel.aggregate(pipeLine).allowDiskUse().exec()
}

module.exports = function* exporter() {
    let result;
    try {
        result = yield* getItemForExport();
    } catch (ex) {
        throw ex;
    }

    return result;
};
