module.exports = (pipeline) => {
    // todo: ostorozhno, zdes' bydyt mytki tak kak eto custom products...

    pipeline.push({
        $project: {
            category: 1,
            customCategory: {
                en: '$category_name.en',
                ar: '$category_name.ar',
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'category',
        },
    });

    pipeline.push({
        $project: {
            category: {
                $cond: {
                    if: {
                        $gt: [{
                            $size: '$category',
                        }, 0],
                    },
                    then: {
                        $let: {
                            vars: {
                                category: { $arrayElemAt: ['$category', 0] },
                            },
                            in: {
                                _id: '$$category._id',
                                name: {
                                    en: {
                                        $toUpper: '$$category.name.en',
                                    },
                                    ar: {
                                        $toUpper: '$$category.name.ar',
                                    },
                                },
                            },
                        },
                    },
                    else: {
                        _id: '$customCategory.en', // tip: the same as ar
                        name: {
                            en: {
                                $toUpper: '$customCategory.en',
                            },
                            ar: {
                                $toUpper: '$customCategory.ar',
                            },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: '$category.name.en',
            count: { $sum: 1 },
            ar: { $first: '$category.name.ar' },
            variants: { $addToSet: '$category._id' },
        },
    });

    pipeline.push({
        $project: {
            category: {
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
            'category.name': 1,
        },
    });

    pipeline.push({
        $redact: {
            $cond: {
                if: {
                    $gt: [{
                        $size: {
                            $filter: {
                                input: '$category._id',
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
            labels: { $push: '$category' },
        },
    });
};
