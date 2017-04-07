const mongoose = require('mongoose');
const CompetitorItemCollection = require('./../../../types/competitorItem/collection');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const query = req.query;
    const queryFilter = query.filter || {};
    const globalSearch = queryFilter.globalSearch;
    const user = req.personnelModel;

    const filter = {};
    const isObjectId = (filter) => {
        return filter.type === 'ObjectId';
    };

    const getSearchReference = (string) => {
        return { $regex: string, $options: 'i' };
    };

    if (queryFilter.country && isObjectId(queryFilter.country)) {
        filter.setCountry = queryFilter.country.values.map(id => ObjectId(id));
    }

    if (queryFilter.brand && isObjectId(queryFilter.brand)) {
        filter.setBrand = queryFilter.brand.values.map(id => ObjectId(id));
    }

    if (queryFilter.origin && isObjectId(queryFilter.origin)) {
        filter.setOrigin = queryFilter.origin.values.map(id => ObjectId(id));
    }

    if (queryFilter.product && isObjectId(queryFilter.product)) {
        filter.setCategory = queryFilter.product.values.map(id => ObjectId(id));
    }

    const isMatch = filter.setCountry || filter.setBrand || filter.setOrigin;

    const pipeline = [{
        $facet: {
            input: [
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: {
                            $ifNull: ['$origin', []],
                        },
                        variant: 1,
                    },
                },
                user.country.length ? {
                    $match: {
                        country: { $in: user.country },
                    },
                } : null,
                isMatch ? {
                    $match: {
                        $and: [
                            filter.setCountry ? { country: { $in: filter.setCountry } } : null,
                            filter.setBrand ? { brand: { $in: filter.setBrand } } : null,
                            filter.setOrigin ? { origin: { $in: filter.setOrigin } } : null,
                        ].filter(condition => condition),
                    },
                } : null,
                {
                    $lookup: {
                        from: 'competitorVariants',
                        localField: 'variant',
                        foreignField: '_id',
                        as: 'variant',
                    },
                },
                {
                    $unwind: {
                        path: '$variant',
                    },
                },
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: 1,
                        variant: {
                            _id: 1,
                            name: 1,
                            category: 1,
                        },
                    },
                },
                globalSearch && globalSearch.length ? {
                    $match: {
                        $or: [
                            { 'variant.name.en': getSearchReference(globalSearch) },
                            { 'variant.name.ar': getSearchReference(globalSearch) },
                        ],
                    },
                } : null,
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: 1,
                        category: '$variant.category',
                    },
                },
                {
                    $group: {
                        _id: null,
                        country: {
                            $addToSet: '$country',
                        },
                        brand: {
                            $addToSet: '$brand',
                        },
                        origin: {
                            $push: '$origin',
                        },
                        category: {
                            $addToSet: '$category',
                        },
                    },
                },
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: {
                            $reduce: {
                                input: '$origin',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$value', []],
                                        },
                                        then: {
                                            $setUnion: ['$$value', '$$this'],
                                        },
                                        else: '$$this',
                                    },
                                },
                            },
                        },
                        category: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'domains',
                        localField: 'country',
                        foreignField: '_id',
                        as: 'country',
                    },
                },
                {
                    $project: {
                        country: {
                            _id: 1,
                            name: 1,
                        },
                        brand: 1,
                        origin: 1,
                        category: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'brands',
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brand',
                    },
                },
                {
                    $project: {
                        country: 1,
                        brand: {
                            _id: 1,
                            name: 1,
                        },
                        origin: 1,
                        category: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'origins',
                        localField: 'origin',
                        foreignField: '_id',
                        as: 'origin',
                    },
                },
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: {
                            _id: 1,
                            name: 1,
                        },
                        category: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: 1,
                        category: {
                            _id: 1,
                            name: 1,
                        },
                    },
                },
                {
                    $project: {
                        country: {
                            _id: 1,
                            name: 1,
                        },
                        brand: {
                            _id: 1,
                            name: 1,
                        },
                        origin: {
                            _id: 1,
                            name: 1,
                        },
                        product: {
                            $map: {
                                input: '$category',
                                as: 'item',
                                in: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                },
                            },
                        },
                    },
                },
            ].filter(stage => stage),
            generic: [
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: {
                            $ifNull: ['$origin', []],
                        },
                        variant: 1,
                    },
                },
                user.country.length ? {
                    $match: {
                        country: { $in: user.country },
                    },
                } : null,
                filter.setCountry || filter.setOrigin ? {
                    $match: {
                        $and: [
                            filter.setCountry ? { country: { $in: filter.setCountry } } : null,
                            filter.setOrigin ? { origin: { $in: filter.setOrigin } } : null,
                        ].filter(condition => condition),
                    },
                } : null,
                {
                    $lookup: {
                        from: 'competitorVariants',
                        localField: 'variant',
                        foreignField: '_id',
                        as: 'variant',
                    },
                },
                {
                    $unwind: {
                        path: '$variant',
                    },
                },
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: 1,
                        variant: {
                            _id: 1,
                            name: 1,
                            category: 1,
                        },
                    },
                },
                globalSearch && globalSearch.length ? {
                    $match: {
                        $or: [
                            { 'variant.name.en': getSearchReference(globalSearch) },
                            { 'variant.name.ar': getSearchReference(globalSearch) },
                        ],
                    },
                } : null,
                {
                    $group: {
                        _id: null,
                        country: {
                            $push: '$country',
                        },
                        brand: {
                            $push: '$brand',
                        },
                        origin: {
                            $push: '$origin',
                        },
                        category: {
                            $push: '$variant.category',
                        },
                    },
                },
                {
                    $project: {
                        country: {
                            $setUnion: '$country',
                        },
                        brand: {
                            $setUnion: '$brand',
                        },
                        origin: {
                            $reduce: {
                                input: '$origin',
                                initialValue: [],
                                in: {
                                    $cond: {
                                        if: {
                                            $ne: ['$$value', []],
                                        },
                                        then: {
                                            $setUnion: ['$$value', '$$this'],
                                        },
                                        else: '$$this',
                                    },
                                },
                            },
                        },
                        category: {
                            $setUnion: '$category',
                        },
                    },
                },
                {
                    $lookup: {
                        from: 'domains',
                        localField: 'country',
                        foreignField: '_id',
                        as: 'country',
                    },
                },
                {
                    $project: {
                        country: {
                            _id: 1,
                            name: 1,
                        },
                        brand: 1,
                        origin: 1,
                        category: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'brands',
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brand',
                    },
                },
                {
                    $project: {
                        country: 1,
                        brand: {
                            _id: 1,
                            name: 1,
                        },
                        origin: 1,
                        category: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'origins',
                        localField: 'origin',
                        foreignField: '_id',
                        as: 'origin',
                    },
                },
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: {
                            _id: 1,
                            name: 1,
                        },
                        category: 1,
                    },
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                {
                    $project: {
                        country: 1,
                        brand: 1,
                        origin: {
                            _id: 1,
                            name: 1,
                        },
                        product: {
                            $map: {
                                input: '$category',
                                as: 'item',
                                in: {
                                    _id: '$$item._id',
                                    name: '$$item.name',
                                },
                            },
                        },
                    },
                },
            ].filter(stage => stage),
        },
    }];

    CompetitorItemCollection.aggregate(pipeline, (err, result) => {
        if (err) {
            return next(err);
        }

        const groups = result.slice().pop();
        const inputFilters = groups.input.length ?
            groups.input.slice().pop() : {
                brand: [],
                origin: [],
                product: [],
            };
        const genericFilters = groups.generic.length ?
            groups.generic.slice().pop() : {
                country: [],
                brand: [],
                origin: [],
            };
        const resultFilters = Object.assign({}, inputFilters, {
            country: genericFilters.country,
            brand: filter.setBrand ? genericFilters.brand : inputFilters.brand,
            origin: filter.setOrigin ? genericFilters.origin : inputFilters.origin,
            product: inputFilters.product,
        });

        res.status(200).send(resultFilters);
    });
};
