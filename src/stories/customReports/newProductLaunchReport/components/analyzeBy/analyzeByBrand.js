module.exports = (pipeline) => {
    // todo: ostorozhno, zdes' bydyt mytki tak kak eto custom brands...

    pipeline.push({
        $project: {
            brand: '$brand._id',
            customBrand: {
                en: '$brand.name',
                ar: '$brand.name',
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'brands',
            localField: 'brand',
            foreignField: '_id',
            as: 'brand',
        },
    });

    pipeline.push({
        $project: {
            brand: {
                $cond: {
                    if: {
                        $gt: [{
                            $size: '$brand',
                        }, 0],
                    },
                    then: {
                        $let: {
                            vars: {
                                brand: { $arrayElemAt: ['$brand', 0] },
                            },
                            in: {
                                _id: '$$brand._id',
                                name: {
                                    en: {
                                        $toUpper: '$$brand.name.en',
                                    },
                                    ar: {
                                        $toUpper: '$$brand.name.ar',
                                    },
                                },
                            },
                        },
                    },
                    else: {
                        _id: '$customBrand.en', // tip: same as ar
                        name: {
                            en: {
                                $toUpper: '$customBrand.en',
                            },
                            ar: {
                                $toUpper: '$customBrand.ar',
                            },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: '$brand.name.en',
            count: { $sum: 1 },
            ar: { $first: '$brand.name.ar' },
            variants: { $addToSet: '$brand._id' },
        },
    });

    pipeline.push({
        $project: {
            brand: {
                _id: '$variants',  // tip: should be an array id
                name: {
                    en: '$_id',
                    ar: '$ar',
                },
            },
            count: '$count',
        },
    });

    pipeline.push({
        $sort: {
            'brand.name': 1,
        },
    });

    pipeline.push({
        $redact: {
            $cond: {
                if: {
                    $gt: [{
                        $size: {
                            $filter: {
                                input: '$brand._id',
                                as: 'id',
                                cond: { $ne: ['$$id', null] },
                            },
                        },
                    }, 0],
                },
                then: '$$KEEP',
                else: '$$PRUNE',
            },
        },
    });

    pipeline.push({
        $group: {
            _id: null,
            data: { $push: '$count' },
            labels: { $push: '$brand' },
        },
    });
};
