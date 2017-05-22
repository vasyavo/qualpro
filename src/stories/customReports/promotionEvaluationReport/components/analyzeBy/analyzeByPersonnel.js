module.exports = (pipeline) => {
    pipeline.push({
        $lookup: {
            from: 'promotionsItems',
            localField: '_id',
            foreignField: 'promotion',
            as: 'promotionItems',
        },
    });

    pipeline.push({
        $project: {
            _id: 1,
            personnel: '$promotionItems.createdBy.user',
        },
    });

    pipeline.push({
        $unwind: '$personnel',
    });

    pipeline.push({
        $group: {
            _id: {
                personnel: '$personnel',
                promotion: '$_id',
            },
            count: { $sum: 1 },
        },
    });

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: '_id.personnel',
            foreignField: '_id',
            as: 'personnel',
        },
    });

    pipeline.push({
        $project: {
            _id: '$_id.personnel',
            count: 1,
            domain: {
                $let: {
                    vars: {
                        personnel: { $arrayElemAt: ['$personnel', 0] },
                    },
                    in: {
                        _id: '$$personnel._id',
                        name: {
                            en: { $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'] },
                            ar: { $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'] },
                        },
                    },
                },
            },
        },
    });
};
