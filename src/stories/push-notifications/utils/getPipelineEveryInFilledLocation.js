/*
* @description Returns aggregation pipeline which fetch every admin or everyone in filled location.
*
* In scope "options.condition" next variables are accessible:
*     {Object} $$personnel which is $$CURRENT
*     {Number} $$accessRoleLevel pointer on $$CURRENT.accessRole.level
*
* In scope "options.condition.admins" next variables are accessible:
*     {String[]} $$setCountry
*     {String[]} $$setRegion
*     {String[]} $$setSubRegion
*
* In scope "options.condition.colleagues" next variables are accessible:
*     {String[]} $$setCountry
*     {String[]} $$setRegion
*     {String[]} $$setSubRegion
*     {String[]} $$setOutlet
*     {String[]} $$setBranch
*
* @param {Object} options
* @param {String[]} [options.setCountry]
* @param {String[]} [options.setRegion]
* @param {String[]} [options.setSubRegion]
* @param {String[]} [options.setOutlet]
* @param {String[]} [options.setBranch]
* @param {Object} options.condition
* @param {Object} options.condition.admins $filter condition
* @param {Object} options.condition.colleagues $filter condition
* @returns {Object[]}
* */
module.exports = (options) => {
    const {
        setCountry,
        setRegion,
        setSubRegion,
        setOutlet,
        setBranch,
        condition,
    } = options;

    const setAdmin = {
        $let: {
            vars: {
                setCountry,
                setRegion,
                setSubRegion,
            },
            in: {
                $filter: {
                    input: '$setPersonnel',
                    as: 'personnel',
                    cond: {
                        $let: {
                            vars: {
                                accessRoleLevel: '$$personnel.accessRole.level',
                                in: condition.admins,
                            },
                        },
                    },
                },
            },
        },
    };
    const setColleagues = {
        $let: {
            vars: {
                setCountry,
                setRegion,
                setSubRegion,
                setOutlet,
                setBranch,
            },
            in: {
                $filter: {
                    input: '$setPersonnel',
                    as: 'personnel',
                    cond: {
                        $let: {
                            vars: {
                                accessRoleLevel: '$$personnel.accessRole.level',
                                in: condition.colleagues,
                            },
                        },
                    },
                },
            },
        },
    };

    const baseProject = {
        accessRole: 1,
        country: 1,
        region: 1,
        subRegion: 1,
        outlet: 1,
        branch: 1,
    };
    const pipeline = [{
        $project: baseProject,
    }, {
        $lookup: {
            from: 'accessRoles',
            localField: 'accessRole',
            foreignField: '_id',
            as: 'accessRole',
        },
    }, {
        $project: Object.assign({}, baseProject, {
            'accessRole._id': 1,
            'accessRole.level': 1,
        }),
    }, {
        $unwind: {
            path: '$accessRole',
        },
    }, {
        $group: {
            _id: null,
            setPersonnel: { $push: '$$ROOT' },
        },
    }, {
        $project: {
            setPersonnel: 1,
            setAdmin,
        },
    }];

    if (options.condition.colleagues) {
        pipeline.push({
            $project: {
                setPersonnel: {
                    $setDifference: ['$setAdmin', '$setPersonnel'],
                },
                setAdmin: 1,
            },
        }, {
            $project: {
                setPersonnel: 1,
                setAdmin: 1,
                setColleagues,
            },
        });
    }

    pipeline.push({
        $project: {
            setAdmin: '$setAdmin._id',
            setColleagues: options.condition.colleagues ?
                '$setColleagues._id' : [],
        },
    });

    return pipeline;
};
