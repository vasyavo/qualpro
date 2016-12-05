const _ = require('lodash');

var AggregationHelper = function (defProjection, filter) {
    var $defProjection = defProjection;
    var curFilter = filter || {};
    var self = this;

    function getGroup($defProjection, object) {
        var resultObject = {};

        for (var key in $defProjection) {
            if (key === '_id') {
                resultObject[key] = '$' + key;
            } else {
                resultObject[key] = {
                    $first: '$' + key
                };
            }
        }

        resultObject._id = resultObject._id || 'no_id';

        return _.assign(resultObject, object);
    }

    function getMatchFilter(array) {
        var resultObject = {};

        array.forEach(function (key) {
            if (curFilter[key]) {
                resultObject[key] = curFilter[key];
            }
        });

        return resultObject;
    }

    this.setSyncQuery = function (queryObject, lastLogOut) {
        queryObject.$or = [
            {
                'editedBy.date': {
                    $gt: lastLogOut
                }
            },
            {
                'createdBy.date': {
                    $gt: lastLogOut
                }
            }
        ];
    };

    this.translatedCond = function (language, fields, translated) {
        var cond = {
            $cond: [
                {
                    $and: []
                },
                true,
                false
            ]
        };

        language = language === 'en' ? 'ar' : 'en';

        if (translated && translated !== 'false') {
            fields.forEach(function (field) {
                cond.$cond[0].$and.push({
                    $gt: [
                        '$' + field + '.' + language,
                        ''
                    ]
                });
            });
        } else {
            fields.forEach(function (field) {
                cond.$cond[0].$and.push({
                    $eq: [
                        '$' + field + '.' + language,
                        ''
                    ]
                });
            });
        }

        return cond;
    };

    this.getGroupObject = function (object) {
        return getGroup(this.getProjection(), object);
    };

    this.setTotal = () => {
        const defProjection = Object.assign({}, $defProjection);
        const defProjectionKeys = Object.keys(defProjection);
        const project = {};

        defProjectionKeys.forEach((key) => {
            project[key] = `$data.${key}`;
        });

        project.total = 1;

        return [{
            $group: {
                _id: null,
                total: { $sum: 1 },
                data: { $push: '$$ROOT' }
            }
        }, {
            $unwind: {
                path: '$data',
                preserveNullAndEmptyArrays: true
            }
        }, {
            $project: project
        }];
    };

    this.groupForUi = () => {
        return [{
            $group: {
                _id: '$total',
                data: { $push: '$$ROOT' }
            }
        }, {
            $project: {
                _id: 0,
                total: '$_id',
                data: 1
            }
        }];
    };

    this.getSearchMatch = (array, searchValue) => {
        const regExps = searchValue.split(' ');
        const resultArray = [];

        array.forEach((element) => {
            const regExpObject = {};

            regExps.forEach((regExp) => {
                regExpObject[element] = {
                    $regex: regExp,
                    $options: 'i'
                };
                resultArray.push(regExpObject);
            });
        });

        return {
            $or: resultArray
        };
    };

    this.getProjection = (object, includeSiblings) => {
        const defProjection = Object.assign({}, $defProjection);

        if (object) {
            for (let item in object) {
                if (object.hasOwnProperty(item)) {
                    const keyName = item.split('.');

                    if (keyName.length > 1) {
                        const innerObj = {};

                        innerObj[keyName[keyName.length - 1]] = object[item];
                        delete object[item];

                        for (let i = keyName.length - 2; i > 0; i--) {
                            innerObj[keyName[i]] = Object.assign({}, innerObj);
                            delete innerObj[keyName[i + 1]];
                        }

                        object[keyName[0]] = Object.assign({}, innerObj);

                        if (includeSiblings) {
                            _.merge(object, includeSiblings);
                        }
                    }
                }
            }
            _.defaults(object, defProjection);

            return object;
        }

        return defProjection;
    };

    this.aggregationPartMaker = function (options) {
        var from = options.from;
        var keyBefore = options.key;
        var keyAs = options.as;
        var addMainProjection = options.addMainProjection;
        var addProjection = options.addProjection;
        var includeSiblings = options.includeSiblings;
        var isArray = (typeof options.isArray === 'boolean') ? options.isArray : true;
        var nameFields = options.nameFields || [];
        var nameFieldQueryObject = {
            en: [],
            ar: []
        };
        var matchFieldsArrayBefore = [keyBefore];
        var matchFieldsArrayAfter = [];
        var key;

        var resultArray;

        var $unwind = {
            path                      : '$' + keyBefore,
            preserveNullAndEmptyArrays: true
        };

        var $lookup = {
            from        : from,
            localField  : keyBefore,
            foreignField: '_id',
            as          : keyAs || keyBefore
        };

        var objectForExtendFirst = {};
        var objectForExtendSecond = {};
        var objectForGroupExtend = {};
        var $firstProjection;
        var $secondProjection;
        var $group;
        var $matchFilterQueryBefore;
        var $matchFilterQueryAfter;

        var elseStateObject;
        var $nullProjection = {};

        key = keyAs || keyBefore;

        objectForExtendFirst[key] = {
            $cond: {
                if  : {$eq: ['$' + key, []]},
                then: null,
                else: {$arrayElemAt: ['$' + key, 0]}
            }
        };

        elseStateObject = {
            _id : '$' + key + '._id',
            name: '$' + key + '.name'
        };

        if (nameFields && nameFields.length) {
            nameFields.forEach(function (nameKey, index) {
                nameFieldQueryObject.en.push('$' + key + '.' + nameKey + '.en');
                nameFieldQueryObject.ar.push('$' + key + '.' + nameKey + '.ar');
                if (index !== nameFields.length) {
                    nameFieldQueryObject.en.push(' ');
                    nameFieldQueryObject.ar.push(' ');
                }
            });

            elseStateObject.name = {
                en: {$concat: nameFieldQueryObject.en},
                ar: {$concat: nameFieldQueryObject.ar}
            };
        }

        /*if (nameFields[0]) {
         objectForExtendSecond[key] = {};
         objectForExtendSecond[key]._id = '$' + key + '._id';
         nameFields.forEach(function (field) {
         objectForExtendSecond[key][field] = '$' + key + '.' + field;
         });
         } else {*/
        objectForExtendSecond[key] = {
            $cond: {
                if  : {$eq: ['$' + key, null]},
                then: null,
                else: elseStateObject
            }
        };
        /*}*/

        if (addMainProjection) {
            if (!(addMainProjection instanceof Array)) {
                addMainProjection = [addMainProjection];
            }

            matchFieldsArrayAfter.concat(addMainProjection);

            addMainProjection.forEach(function (addMainProjectionItem) {
                /* TODO check removing keys */
                // elseStateObject[addMainProjectionItem] = '$' + key + '.' + addMainProjectionItem;
                objectForExtendSecond[addMainProjectionItem] = '$' + key + '.' + addMainProjectionItem;
                objectForGroupExtend[addMainProjectionItem] = {$addToSet: '$' + addMainProjectionItem};
            });
        }

        if (keyBefore === 'parent') {
            matchFieldsArrayAfter.push(key + '._id');
            if (curFilter[key]) {
                curFilter[key + '._id'] = curFilter[key];
            }
        }

        if (addProjection) {
            if (!(addProjection instanceof Array)) {
                addProjection = [addProjection];
            }

            matchFieldsArrayAfter.concat(_.map(addProjection, function (addProjectionKey) {
                return key + '.' + addProjectionKey;
            }));

            addProjection.forEach(function (addProjectionItem) {
                elseStateObject[addProjectionItem] = '$' + key + '.' + addProjectionItem;

                if (nameFields[0]) {
                    objectForExtendSecond[key][addProjectionItem] = '$' + key + '.' + addProjectionItem;
                }
            });
        }

        objectForGroupExtend[key] = {
            $addToSet: '$' + key
        };

        $firstProjection = this.getProjection(objectForExtendFirst, includeSiblings);
        $secondProjection = this.getProjection(objectForExtendSecond, includeSiblings);
        $group = getGroup(this.getProjection(), objectForGroupExtend);
        $matchFilterQueryAfter = getMatchFilter(matchFieldsArrayAfter);
        $matchFilterQueryBefore = getMatchFilter(matchFieldsArrayBefore);

        resultArray = [{$match: $matchFilterQueryBefore}, {$lookup: $lookup}, {$project: $firstProjection}, {$project: $secondProjection}, {$match: $matchFilterQueryAfter}];

        if (isArray) {
            resultArray.unshift({$unwind: $unwind});
            resultArray.push({$group: $group});
            $nullProjection[key] = {
                $filter: {
                    input: '$' + key,
                    as   : 'oneItem',
                    cond : {$ne: ['$$oneItem', null]}
                }
            };
            resultArray.push({$project: this.getProjection($nullProjection)});
        }

        return resultArray;
    };

    this.endOfPipeLine = (options) => {
        const isMobile = options.isMobile;
        const searchFieldsArray = options.searchFieldsArray;
        const filterSearch = options.filterSearch;
        const skip = options.skip;
        const limit = options.limit;
        const sort = options.sort;
        const creationDate = options.creationDate;
        const pipeLine = [];

        if (isMobile && creationDate) {
            pipeLine.push({
                $project: self.getProjection({
                    creationDate: '$createdBy.date',
                    updateDate: '$editedBy.date'
                })
            });
        }

        if (sort) {
            pipeLine.push({
                $sort: sort
            });
        } else {
            pipeLine.push({
                $project: self.getProjection({
                    lastDate: {
                        $ifNull: [
                            '$editedBy.date',
                            '$createdBy.date'
                        ]
                    }
                })
            });

            pipeLine.push({
                $sort: {
                    lastDate: -1
                }
            });
        }

        if (!isMobile && searchFieldsArray && filterSearch) {
            pipeLine.push({
                $match: self.getSearchMatch(searchFieldsArray, filterSearch)
            });
        }

        pipeLine.push(...self.setTotal());

        if (limit && limit !== -1) {
            pipeLine.push({
                $skip: skip
            });

            pipeLine.push({
                $limit: limit
            });
        }

        pipeLine.push(...self.groupForUi());

        return pipeLine;
    };
};

module.exports = AggregationHelper;
