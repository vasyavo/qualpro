const DomainModel = require('./../../../types/domain/model');
const BranchModel = require('./../../../types/branch/model');

/*
 * @description returns personnel by aggregate query
 * @param {Object} options
 * @param {Array} options.query
 * @returns {Array}
 * */

module.exports = function * ({contentType, itemId}) {

    let ModelType;
    let pipeline = [{
        $match : {
            _id : itemId
        }
    }];

    switch (contentType) {
        case ('branch') :
            ModelType = BranchModel;

            pipeline.push({
                $lookup: {
                    from      : 'domains',
                    localField: 'subRegion',
                    foreignField   : '_id',
                    as        : 'subRegion'
                }
            });
            pipeline.push({
                $project: {
                    subRegion: {$arrayElemAt: ['$subRegion', 0]},
                    branch   : '$_id'
                }});
            pipeline.push({
                $project: {
                    branch   : 1,
                    subRegion: '$subRegion._id',
                    parent   : '$subRegion.parent'
                }
            });
        case ('subRegion') :
            pipeline.push({
                $lookup: {
                    from      : 'domains',
                    localField: 'parent',
                    foreignField   : '_id',
                    as        : 'region'
                }
            });
            pipeline.push({
                $project: {
                    region: {$arrayElemAt: ['$region', 0]},
                    subRegion : {$ifNull : ['$subRegion', '$_id']},
                    branch  : 1
                }
            });
            pipeline.push({
                $project: {
                    subRegion: 1,
                    branch   : 1,
                    region   : '$region._id',
                    parent   : '$region.parent'
                }
            });
        case ('region') :
            console.log(ModelType);
            ModelType = ModelType || DomainModel;
            pipeline.push({
                $lookup: {
                    from      : 'domains',
                    localField: 'parent',
                    foreignField   : '_id',
                    as        : 'country'
                }
            });
            pipeline.push({
                    $project: {
                        country  : {$arrayElemAt: ['$country', 0]},
                        region   : {$ifNull: ['$region', '$_id']},
                        subRegion: 1,
                        branch   : 1
                    }
                });
            pipeline.push({
                $project: {
                    country  : '$country._id',
                    region   : '$region',
                    subRegion: '$subRegion',
                    branch   : '$branch'
                }
            });
            break;
    }

    let data;

    if (ModelType) {
        data = yield ModelType.aggregate(pipeline).exec();
    }

    return data && data[0] || {};
};

