'use strict';
module.exports = function (PersonnelModel, accessRoleLevel, contentType, cb) {
    var _;
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var AggregationHelper;
    var currentDomain;
    var aggregateHelper;
    var groupObject;
    var pipeLine;
    var $defProjection;
    var aggregation;

    switch (accessRoleLevel) {
        case '2':
        case '9':
            currentDomain = CONTENT_TYPES.COUNTRY;
            break;
        case '3':
            currentDomain = CONTENT_TYPES.REGION;
            break;
        case '4':
            currentDomain = CONTENT_TYPES.SUBREGION;
            break;
    }

    if (accessRoleLevel && currentDomain === contentType) {
        _ = require('underscore');
        AggregationHelper = require('./aggregationCreater');
        groupObject = {_id: null};
        pipeLine = [];

        $defProjection = {
            accessRole: 1
        };

        $defProjection[currentDomain] = 1;

        aggregateHelper = new AggregationHelper($defProjection);

        pipeLine.push({
            $project: aggregateHelper.getProjection()
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from         : 'accessRoles',
            key          : 'accessRole',
            isArray      : false,
            addProjection: ['level']
        }));

        pipeLine.push({
            $match: {
                'accessRole.level': parseInt(accessRoleLevel, 10)
            }
        });

        pipeLine.push({
            $unwind: {
                path                      : '$' + currentDomain,
                preserveNullAndEmptyArrays: true
            }
        });

        groupObject[currentDomain] = {$addToSet: '$' + currentDomain};

        pipeLine.push({$group: groupObject});

        aggregation = PersonnelModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, response) {
            if (err) {
                console.log(err);
            } else {
                cb(response[0][currentDomain]);
            }
        });
    } else {
        cb();
    }
};
