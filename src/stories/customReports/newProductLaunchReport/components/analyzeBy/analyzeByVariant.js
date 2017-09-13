module.exports = (pipeline) => {
    // todo: ostorozhno, zdes' bydyt mytki tak kak eto custom variants...

    pipeline.push({
        $project: {
            variant: '$variant._id',
            customVariant: {
                en: '$variant.name',
                ar: '$variant.name',
            },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'variants',
            localField: 'variant',
            foreignField: '_id',
            as: 'variant',
        },
    });

    pipeline.push({
        $project: {
            variant: {
                $cond: {
                    if: {
                        $gt: [{
                            $size: '$variant',
                        }, 0],
                    },
                    then: {
                        $let: {
                            vars: {
                                variant: { $arrayElemAt: ['$variant', 0] },
                            },
                            in: {
                                _id: '$$variant._id',
                                name: {
                                    en: {
                                        $toUpper: '$$variant.name.en',
                                    },
                                    ar: {
                                        $toUpper: '$$variant.name.ar',
                                    },
                                },
                            },
                        },
                    },
                    else: {
                        _id: '$customVariant.en', // tip: same as ar
                        name: {
                            en: {
                                $toUpper: '$customVariant.en',
                            },
                            ar: {
                                $toUpper: '$customVariant.ar',
                            },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({
        $group: {
            _id: '$variant.name.en',
            count: { $sum: 1 },
            ar: { $first: '$variant.name.ar' },
            variants: { $addToSet: '$variant._id' },
        },
    });

    pipeline.push({
        $project: {
            variant: {
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
            'variant.name': 1,
        },
    });

    pipeline.push({
        $redact: {
            $cond: {
                if: {
                    $gt: [{
                        $size: {
                            $filter: {
                                input: '$variant._id',
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
            labels: { $push: '$variant' },
        },
    });
};
