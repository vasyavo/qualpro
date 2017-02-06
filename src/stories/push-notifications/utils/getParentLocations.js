const DomainModel = require('./../../../types/domain/model');
const BranchModel = require('./../../../types/branch/model');

/*
 * @description returns personnel by aggregate query
 * @param {Object} options
 * @param {Array} options.query
 * @returns {Array}
 * */

module.exports = function * ({type, itemId}) {

    let ModelType;
    let pipeline = [{
        $match : {
            _id : itemId
        }
    }];

    switch (type) {
        case ('branch') :
            ModelType = BranchModel;

            pipeline.push({
                $lookup: {
                    from      : 'branches',
                    localField: 'subRegion',
                    foreign   : '_id',
                    as        : 'subRegion'
                }
            });
            pipeline.push({
                $project: {
                    subRegion: {$arrayElemAt: ['$subRegion', 0]},
                    branch   : '$_id'
                },
                $project: {
                    branch   : 1,
                    subRegion: '$subRegion._id',
                    parent   : '$subRegion.parent'
                }
            });
        case ('subRegion') :
            pipeline.push({
                $lookup: {
                    from      : 'Domains',
                    localField: 'parent',
                    foreign   : '_id',
                    as        : 'region'
                }
            });
            pipeline.push({
                $project: {
                    region: {$arrayElemAt: ['$region', 0]},
                    subRegion : {$ifNull : ['$subRegion', '$_id']},
                    branch  : 1
                },
                $project: {
                    subRegion: 1,
                    branch   : 1,
                    region   : '$region._id',
                    parent   : '$region.parent'
                }
            });
        case ('region') :
            ModelType = ModelType || DomainModel;
            pipeline.push({
                $lookup: {
                    from      : 'Domains',
                    localField: 'parent',
                    foreign   : '_id',
                    as        : 'country'
                }
            });
            pipeline.push({
                $project: {
                    country : {$arrayElemAt: ['$country', 0]},
                    region  : {$ifNull : ['$region', '$_id']},
                    subRegion: 1,
                    branch   : 1
                },
                $project: {
                    country  : '$country._id',
                    region   : 1,
                    subRegion: 1,
                    branch   : 1
                }
            });
            break;
    }

    const data = yield ModelType.aggregate(pipeline).exec();

    return data && data[0];
}
;

