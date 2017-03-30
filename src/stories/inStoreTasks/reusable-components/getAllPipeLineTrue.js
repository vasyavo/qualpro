module.exports = (options) => {
    const {
        queryObject,
        positionFilter,
        isMobile,
        skip,
        limit,
        filterSearch,
        personnel,
    } = options;

    const locations = ['country', 'region', 'subRegion', 'branch'];
    const pipeline = [];

    pipeline.push({
        $match: queryObject,
    });

    if (!isMobile) {
        pipeline.push({
            $match: {
                $or: [
                    { archived: false },
                    { archived: { $exists: false } },
                ],
            },
        });
    }

    const $locationMatch = {
        $and: [],
    };

    locations.forEach((location) => {
        if (personnel[location] && personnel[location].length && !queryObject[location]) {
            $locationMatch.$and.push({
                $or: [
                    {
                        [location]: { $in: personnel[location] },
                    },
                    {
                        [location]: { $eq: [] },
                    },
                    {
                        [location]: { $eq: null },
                    },
                ],
            });
        }
    });

    if ($locationMatch.$and.length) {
        pipeline.push({
            $match: $locationMatch,
        });
    }

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'assignedTo',
        },
    });

    pipeline.push({
        $lookup: {
            from: 'personnels',
            localField: 'createdBy.user',
            foreignField: '_id',
            as: 'createdBy.user',
        },
    });

    pipeline.push({
        $project: {
            assignedTo: {
                $map: {
                    input: '$assignedTo',
                    as: 'item',
                    in: {
                        _id: '$$item._id',
                        position: '$$item.position',
                        accessRole: '$$item.accessRole',
                        firstName: '$$item.firstName',
                        lastName: '$$item.lastName',
                        name: {
                            en: {
                                $concat: ['$$item.firstName.en', ' ', '$$item.lastName.en'],
                            },
                            ar: {
                                $concat: ['$$item.firstName.ar', ' ', '$$item.lastName.ar'],
                            },
                        },
                    },
                },
            },
            createdBy: {
                date: 1,
                user: {
                    $let: {
                        vars: {
                            personnel: { $arrayElemAt: ['$createdBy.user', 0] },
                        },
                        in: {
                            _id: '$$personnel._id',
                            name: {
                                en: {
                                    $concat: ['$$personnel.firstName.en', ' ', '$$personnel.lastName.en'],
                                },
                                ar: {
                                    $concat: ['$$personnel.firstName.ar', ' ', '$$personnel.lastName.ar'],
                                },
                            },
                            firstName: '$$personnel.firstName',
                            lastName: '$$personnel.lastName',
                            position: '$$personnel.position',
                            accessRole: '$$personnel.accessRole',
                        },
                    },
                },
            },
            title: 1,
            companyObjective: 1,
            description: 1,
            objectiveType: 1,
            priority: 1,
            status: 1,
            complete: 1,
            level: 1,
            countSubTasks: 1,
            completedSubTasks: 1,
            history: 1,
            dateStart: 1,
            dateEnd: 1,
            dateClosed: 1,
            comments: 1,
            attachments: 1,
            editedBy: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            branch: 1,
            location: 1,
            form: 1,
            efforts: 1,
            context: 1,
            creationDate: 1,
            updateDate: 1,
            archived: 1,
        },
    });

    if (positionFilter) {
        pipeline.push({
            $match: positionFilter,
        });
    }

    const getSearchReference = (string) => {
        return { $regex: string, $options: 'i' };
    };

    if (filterSearch && filterSearch.length > 0) {
        pipeline.push({
            $match: {
                $or: [
                    { 'createdBy.user.name.en': getSearchReference(filterSearch) },
                    { 'createdBy.user.name.ar': getSearchReference(filterSearch) },
                    { 'assignedTo.name.ar': getSearchReference(filterSearch) },
                    { 'assignedTo.name.en': getSearchReference(filterSearch) },
                    { 'title.en': getSearchReference(filterSearch) },
                    { 'title.ar': getSearchReference(filterSearch) },
                    { 'description.en': getSearchReference(filterSearch) },
                    { 'description.ar': getSearchReference(filterSearch) },
                ],
            },
        });
    }

    // pagination start

    if (limit) {
        pipeline.push({
            $group: {
                _id: null,
                setObjectives: { $push: '$_id' },
                total: { $sum: 1 },
            },
        });

        pipeline.push({
            $project: {
                setObjectives: {
                    $let: {
                        vars: {
                            skip,
                            limit,
                        },
                        in: {
                            $cond: {
                                if: {
                                    $gte: [
                                        '$total',
                                        { $add: ['$$skip', '$$limit'] },
                                    ],
                                },
                                then: { $slice: ['$setObjectives', '$$skip', '$$limit'] },
                                else: {
                                    $cond: {
                                        if: {
                                            $gt: [
                                                '$total',
                                                '$$skip',
                                            ],
                                        },
                                        then: {
                                            $slice: ['$setObjectives', '$$skip', { $subtract: ['$total', '$$skip'] }],
                                        },
                                        else: '$setObjectives',
                                    },
                                },
                            },
                        },
                    },
                },
                total: 1,
            },
        });

        pipeline.push({
            $unwind: '$setObjectives',
        });

        pipeline.push({
            $lookup: {
                from: 'objectives',
                localField: 'setObjectives',
                foreignField: '_id',
                as: 'objective',
            },
        });

        pipeline.push({
            $project: {
                objective: {
                    $let: {
                        vars: {
                            fields: { $arrayElemAt: ['$objective', 0] },
                        },
                        in: {
                            total: '$total',
                            _id: '$$fields._id',
                            assignedTo: '$$fields.assignedTo',
                            createdBy: '$$fields.createdBy',
                            title: '$$fields.title',
                            companyObjective: '$$fields.companyObjective',
                            description: '$$fields.description',
                            objectiveType: '$$fields.objectiveType',
                            priority: '$$fields.priority',
                            status: '$$fields.status',
                            complete: '$$fields.complete',
                            level: '$$fields.level',
                            countSubTasks: '$$fields.countSubTasks',
                            completedSubTasks: '$$fields.completedSubTasks',
                            dateStart: '$$fields.dateStart',
                            dateEnd: '$$fields.dateEnd',
                            dateClosed: '$$fields.dateClosed',
                            comments: '$$fields.comments',
                            attachments: '$$fields.attachments',
                            editedBy: '$$fields.editedBy',
                            country: '$$fields.country',
                            history: '$$fields.history',
                            region: '$$fields.region',
                            subRegion: '$$fields.subRegion',
                            retailSegment: '$$fields.retailSegment',
                            outlet: '$$fields.outlet',
                            branch: '$$fields.branch',
                            location: '$$fields.location',
                            form: '$$fields.form',
                            efforts: '$$fields.efforts',
                            context: '$$fields.context',
                            creationDate: '$$fields.creationDate',
                            updateDate: '$$fields.updateDate',
                            archived: '$$fields.archived',
                        },
                    },
                },
            },
        });

        pipeline.push({
            $replaceRoot: {
                newRoot: '$objective',
            },
        });
    }

    // pagination end

    if (limit && !isMobile) {
        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'assignedTo',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                assignedTo: {
                    _id: 1,
                    position: 1,
                    accessRole: 1,
                    firstName: 1,
                    lastName: 1,
                },
                createdBy: 1,
                title: 1,
                companyObjective: 1,
                description: 1,
                objectiveType: 1,
                priority: 1,
                status: 1,
                complete: 1,
                parent: 1,
                history: 1,
                level: 1,
                countSubTasks: 1,
                completedSubTasks: 1,
                dateStart: 1,
                dateEnd: 1,
                dateClosed: 1,
                comments: 1,
                attachments: 1,
                editedBy: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                location: 1,
                form: 1,
                efforts: 1,
                context: 1,
                creationDate: 1,
                updateDate: 1,
                archived: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'createdBy.user',
                foreignField: '_id',
                as: 'createdBy.user',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                assignedTo: 1,
                createdBy: {
                    date: 1,
                    user: {
                        $let: {
                            vars: {
                                personnel: { $arrayElemAt: ['$createdBy.user', 0] },
                            },
                            in: {
                                _id: '$$personnel._id',
                                firstName: '$$personnel.firstName',
                                lastName: '$$personnel.lastName',
                                position: '$$personnel.position',
                                accessRole: '$$personnel.accessRole',
                            },
                        },
                    },
                },
                title: 1,
                companyObjective: 1,
                description: 1,
                objectiveType: 1,
                priority: 1,
                status: 1,
                complete: 1,
                parent: 1,
                level: 1,
                countSubTasks: 1,
                completedSubTasks: 1,
                dateStart: 1,
                history: 1,
                dateEnd: 1,
                dateClosed: 1,
                comments: 1,
                attachments: 1,
                editedBy: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                location: 1,
                form: 1,
                efforts: 1,
                context: 1,
                creationDate: 1,
                updateDate: 1,
                archived: 1,
            },
        });
    }

    if (!limit && isMobile) {
        pipeline.push({
            $addFields: {
                createdBy: {
                    date: '$createdBy.date',
                    user: {
                        _id: '$createdBy.user._id',
                    },
                },
                assignedTo: {
                    $map: {
                        input: '$assignedTo',
                        as: 'item',
                        in: {
                            _id: '$$item._id',
                            position: '$$item.position',
                        },
                    },
                },
            },
        });
    }

    if (limit && isMobile) {
        pipeline.push({
            $project: {
                createdBy: {
                    date: '$createdBy.date',
                    user: {
                        _id: '$createdBy.user',
                    },
                },
                total: 1,
                assignedTo: 1,
                title: 1,
                companyObjective: 1,
                description: 1,
                objectiveType: 1,
                priority: 1,
                status: 1,
                complete: 1,
                parent: 1,
                level: 1,
                history: 1,
                countSubTasks: 1,
                completedSubTasks: 1,
                dateStart: 1,
                dateEnd: 1,
                dateClosed: 1,
                comments: 1,
                attachments: 1,
                editedBy: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                location: 1,
                form: 1,
                efforts: 1,
                context: 1,
                creationDate: 1,
                updateDate: 1,
                archived: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'personnels',
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'assignedTo',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                assignedTo: {
                    _id: 1,
                    position: 1,
                    accessRole: 1,
                },
                createdBy: 1,
                title: 1,
                companyObjective: 1,
                description: 1,
                objectiveType: 1,
                priority: 1,
                status: 1,
                complete: 1,
                parent: 1,
                history: 1,
                level: 1,
                countSubTasks: 1,
                completedSubTasks: 1,
                dateStart: 1,
                dateEnd: 1,
                dateClosed: 1,
                comments: 1,
                attachments: 1,
                editedBy: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                location: 1,
                form: 1,
                efforts: 1,
                context: 1,
                creationDate: 1,
                updateDate: 1,
                archived: 1,
            },
        });
    }

    pipeline.push({
        $lookup: {
            from: 'files',
            localField: 'attachments',
            foreignField: '_id',
            as: 'attachments',
        },
    });

    pipeline.push({
        $project: {
            total: 1,
            assignedTo: 1,
            createdBy: 1,
            title: 1,
            companyObjective: 1,
            description: 1,
            objectiveType: 1,
            priority: 1,
            status: 1,
            complete: 1,
            parent: 1,
            level: 1,
            history: 1,
            countSubTasks: 1,
            completedSubTasks: 1,
            dateStart: 1,
            dateEnd: 1,
            dateClosed: 1,
            comments: 1,
            attachments: {
                _id: 1,
                name: 1,
                contentType: 1,
                originalName: 1,
                createdBy: 1,
            },
            editedBy: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            branch: 1,
            location: 1,
            form: 1,
            efforts: 1,
            context: 1,
            creationDate: 1,
            updateDate: 1,
            archived: 1,
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'country',
            foreignField: '_id',
            as: 'country',
        },
    });

    pipeline.push({
        $project: {
            total: 1,
            assignedTo: 1,
            createdBy: 1,
            title: 1,
            companyObjective: 1,
            description: 1,
            objectiveType: 1,
            history: 1,
            priority: 1,
            status: 1,
            complete: 1,
            parent: 1,
            level: 1,
            countSubTasks: 1,
            completedSubTasks: 1,
            dateStart: 1,
            dateEnd: 1,
            dateClosed: 1,
            comments: 1,
            attachments: 1,
            editedBy: 1,
            country: {
                _id: 1,
                name: 1,
            },
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            branch: 1,
            location: 1,
            form: 1,
            efforts: 1,
            context: 1,
            creationDate: 1,
            updateDate: 1,
            archived: 1,
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'region',
            foreignField: '_id',
            as: 'region',
        },
    });

    pipeline.push({
        $project: {
            total: 1,
            assignedTo: 1,
            createdBy: 1,
            title: 1,
            companyObjective: 1,
            description: 1,
            objectiveType: 1,
            priority: 1,
            status: 1,
            complete: 1,
            history: 1,
            parent: 1,
            level: 1,
            countSubTasks: 1,
            completedSubTasks: 1,
            dateStart: 1,
            dateEnd: 1,
            dateClosed: 1,
            comments: 1,
            attachments: 1,
            editedBy: 1,
            country: 1,
            region: {
                _id: 1,
                name: 1,
            },
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            branch: 1,
            location: 1,
            form: 1,
            efforts: 1,
            context: 1,
            creationDate: 1,
            updateDate: 1,
            archived: 1,
        },
    });

    pipeline.push({
        $lookup: {
            from: 'domains',
            localField: 'subRegion',
            foreignField: '_id',
            as: 'subRegion',
        },
    });

    pipeline.push({
        $project: {
            total: 1,
            assignedTo: 1,
            createdBy: 1,
            title: 1,
            companyObjective: 1,
            history: 1,
            description: 1,
            objectiveType: 1,
            priority: 1,
            status: 1,
            complete: 1,
            parent: 1,
            level: 1,
            countSubTasks: 1,
            completedSubTasks: 1,
            dateStart: 1,
            dateEnd: 1,
            dateClosed: 1,
            comments: 1,
            attachments: 1,
            editedBy: 1,
            country: 1,
            region: 1,
            subRegion: {
                _id: 1,
                name: 1,
            },
            retailSegment: 1,
            outlet: 1,
            branch: 1,
            location: 1,
            form: 1,
            efforts: 1,
            context: 1,
            creationDate: 1,
            updateDate: 1,
            archived: 1,
        },
    });

    pipeline.push({
        $lookup: {
            from: 'retailSegments',
            localField: 'retailSegment',
            foreignField: '_id',
            as: 'retailSegment',
        },
    });

    pipeline.push({
        $project: {
            total: 1,
            assignedTo: 1,
            createdBy: 1,
            title: 1,
            companyObjective: 1,
            description: 1,
            objectiveType: 1,
            priority: 1,
            history: 1,
            status: 1,
            complete: 1,
            parent: 1,
            level: 1,
            countSubTasks: 1,
            completedSubTasks: 1,
            dateStart: 1,
            dateEnd: 1,
            dateClosed: 1,
            comments: 1,
            attachments: 1,
            editedBy: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: {
                _id: 1,
                name: 1,
            },
            outlet: 1,
            branch: 1,
            location: 1,
            form: 1,
            efforts: 1,
            context: 1,
            creationDate: 1,
            updateDate: 1,
            archived: 1,
        },
    });

    pipeline.push({
        $lookup: {
            from: 'outlets',
            localField: 'outlet',
            foreignField: '_id',
            as: 'outlet',
        },
    });

    pipeline.push({
        $project: {
            total: 1,
            assignedTo: 1,
            createdBy: 1,
            title: 1,
            companyObjective: 1,
            description: 1,
            objectiveType: 1,
            history: 1,
            priority: 1,
            status: 1,
            complete: 1,
            parent: 1,
            level: 1,
            countSubTasks: 1,
            completedSubTasks: 1,
            dateStart: 1,
            dateEnd: 1,
            dateClosed: 1,
            comments: 1,
            attachments: 1,
            editedBy: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: {
                _id: 1,
                name: 1,
            },
            branch: 1,
            location: 1,
            form: 1,
            efforts: 1,
            context: 1,
            creationDate: 1,
            updateDate: 1,
            archived: 1,
        },
    });

    pipeline.push({
        $lookup: {
            from: 'branches',
            localField: 'branch',
            foreignField: '_id',
            as: 'branch',
        },
    });

    pipeline.push({
        $project: {
            total: 1,
            assignedTo: 1,
            createdBy: 1,
            title: 1,
            companyObjective: 1,
            history: 1,
            description: 1,
            objectiveType: 1,
            priority: 1,
            status: 1,
            complete: 1,
            parent: 1,
            level: 1,
            countSubTasks: 1,
            completedSubTasks: 1,
            dateStart: 1,
            dateEnd: 1,
            dateClosed: 1,
            comments: 1,
            attachments: 1,
            editedBy: 1,
            country: 1,
            region: 1,
            subRegion: 1,
            retailSegment: 1,
            outlet: 1,
            branch: {
                _id: 1,
                name: 1,
            },
            location: 1,
            form: 1,
            efforts: 1,
            context: 1,
            creationDate: 1,
            updateDate: 1,
            archived: 1,
        },
    });

    if (!isMobile) {
        pipeline.push({
            $unwind: {
                path: '$assignedTo',
                preserveNullAndEmptyArrays: true,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'accessRoles',
                localField: 'assignedTo.accessRole',
                foreignField: '_id',
                as: 'assignedTo.accessRole',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                assignedTo: {
                    _id: 1,
                    position: 1,
                    firstName: 1,
                    lastName: 1,
                    accessRole: {
                        $let: {
                            vars: {
                                accessRole: { $arrayElemAt: ['$assignedTo.accessRole', 0] },
                            },
                            in: {
                                _id: '$$accessRole._id',
                                name: '$$accessRole.name',
                                level: '$$accessRole.level',
                            },
                        },
                    },
                },
                createdBy: 1,
                title: 1,
                companyObjective: 1,
                description: 1,
                objectiveType: 1,
                priority: 1,
                status: 1,
                complete: 1,
                parent: 1,
                level: 1,
                countSubTasks: 1,
                completedSubTasks: 1,
                dateStart: 1,
                dateEnd: 1,
                history: 1,
                dateClosed: 1,
                comments: 1,
                attachments: 1,
                editedBy: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                location: 1,
                form: 1,
                efforts: 1,
                context: 1,
                creationDate: 1,
                updateDate: 1,
                archived: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'assignedTo.position',
                foreignField: '_id',
                as: 'assignedTo.position',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                assignedTo: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    accessRole: 1,
                    position: {
                        $let: {
                            vars: {
                                position: { $arrayElemAt: ['$assignedTo.position', 0] },
                            },
                            in: {
                                _id: '$$position._id',
                                name: '$$position.name',
                                level: '$$position.level',
                            },
                        },
                    },
                },
                createdBy: 1,
                title: 1,
                companyObjective: 1,
                description: 1,
                objectiveType: 1,
                priority: 1,
                history: 1,
                status: 1,
                complete: 1,
                parent: 1,
                level: 1,
                countSubTasks: 1,
                completedSubTasks: 1,
                dateStart: 1,
                dateEnd: 1,
                dateClosed: 1,
                comments: 1,
                attachments: 1,
                editedBy: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                location: 1,
                form: 1,
                efforts: 1,
                context: 1,
                creationDate: 1,
                updateDate: 1,
                archived: 1,
            },
        });

        pipeline.push({
            $group: {
                _id: '$_id',
                assignedTo: { $addToSet: '$assignedTo' },
                total: { $first: '$total' },
                createdBy: { $first: '$createdBy' },
                title: { $first: '$title' },
                companyObjective: { $first: '$companyObjective' },
                description: { $first: '$description' },
                objectiveType: { $first: '$objectiveType' },
                priority: { $first: '$priority' },
                status: { $first: '$status' },
                complete: { $first: '$complete' },
                history: { $first: '$complete' },
                parent: { $first: '$parent' },
                level: { $first: '$level' },
                countSubTasks: { $first: '$countSubTasks' },
                completedSubTasks: { $first: '$completedSubTasks' },
                dateStart: { $first: '$dateStart' },
                dateEnd: { $first: '$dateEnd' },
                dateClosed: { $first: '$dateClosed' },
                comments: { $first: '$comments' },
                attachments: { $first: '$attachments' },
                editedBy: { $first: '$editedBy' },
                country: { $first: '$country' },
                region: { $first: '$region' },
                subRegion: { $first: '$subRegion' },
                retailSegment: { $first: '$retailSegment' },
                outlet: { $first: '$outlet' },
                branch: { $first: '$branch' },
                location: { $first: '$location' },
                form: { $first: '$form' },
                efforts: { $first: '$efforts' },
                context: { $first: '$context' },
                creationDate: { $first: '$creationDate' },
                updateDate: { $first: '$updateDate' },
                archived: { $first: '$archived' },
            },
        });

        pipeline.push({
            $lookup: {
                from: 'accessRoles',
                localField: 'createdBy.user.accessRole',
                foreignField: '_id',
                as: 'createdBy.user.accessRole',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                assignedTo: 1,
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        position: 1,
                        firstName: 1,
                        lastName: 1,
                        accessRole: {
                            $let: {
                                vars: {
                                    accessRole: { $arrayElemAt: ['$createdBy.user.accessRole', 0] },
                                },
                                in: {
                                    _id: '$$accessRole._id',
                                    name: '$$accessRole.name',
                                    level: '$$accessRole.level',
                                },
                            },
                        },
                    },
                },
                title: 1,
                companyObjective: 1,
                description: 1,
                objectiveType: 1,
                priority: 1,
                status: 1,
                complete: 1,
                parent: 1,
                level: 1,
                countSubTasks: 1,
                completedSubTasks: 1,
                dateStart: 1,
                dateEnd: 1,
                dateClosed: 1,
                history: 1,
                comments: 1,
                attachments: 1,
                editedBy: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                location: 1,
                form: 1,
                efforts: 1,
                context: 1,
                creationDate: 1,
                updateDate: 1,
                archived: 1,
            },
        });

        pipeline.push({
            $lookup: {
                from: 'positions',
                localField: 'createdBy.user.position',
                foreignField: '_id',
                as: 'createdBy.user.position',
            },
        });

        pipeline.push({
            $project: {
                total: 1,
                assignedTo: 1,
                createdBy: {
                    date: 1,
                    user: {
                        _id: 1,
                        accessRole: 1,
                        firstName: 1,
                        lastName: 1,
                        position: {
                            $let: {
                                vars: {
                                    position: { $arrayElemAt: ['$createdBy.user.position', 0] },
                                },
                                in: {
                                    _id: '$$position._id',
                                    name: '$$position.name',
                                },
                            },
                        },
                    },
                },
                title: 1,
                companyObjective: 1,
                description: 1,
                objectiveType: 1,
                priority: 1,
                status: 1,
                complete: 1,
                parent: 1,
                level: 1,
                countSubTasks: 1,
                history: 1,
                completedSubTasks: 1,
                dateStart: 1,
                dateEnd: 1,
                dateClosed: 1,
                comments: 1,
                attachments: 1,
                editedBy: 1,
                country: 1,
                region: 1,
                subRegion: 1,
                retailSegment: 1,
                outlet: 1,
                branch: 1,
                location: 1,
                form: 1,
                efforts: 1,
                context: 1,
                creationDate: 1,
                updateDate: 1,
                archived: 1,
            },
        });
    }

    pipeline.push({
        $group: {
            _id: null,
            data: {
                $push: '$$ROOT',
            },
            total: { $first: '$total' },
        },
    });

    pipeline.push({
        $project: {
            _id: 0,
            total: 1,
            data: 1,
        },
    });

    return pipeline;
};
