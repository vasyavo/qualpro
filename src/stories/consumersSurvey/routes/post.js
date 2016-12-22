const async = require('async');
const _ = require('underscore');
const event = require('../../../utils/eventEmitter');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const PersonnelModel = require('../../../types/personnel/model');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const bodyValidator = require('../../../helpers/bodyValidator');
const access = require('../../../helpers/access')();
const ACL_MODULES = require('../../../constants/aclModulesNames');
const getByIdAggr = require('../reusable-components/getByIdAggr');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const ACL_CONSTANTS = require('../../../constants/aclRolesNames');
const ACTIVITY_TYPES = require('../../../constants/activityTypes');

const $defProjection = {
    _id: 1,
    title: 1,
    dueDate: 1,
    country: 1,
    region: 1,
    subRegion: 1,
    retailSegment: 1,
    outlet: 1,
    branch: 1,
    countAll: 1,
    countAnswered: 1,
    status: 1,
    questions: 1,
    location: 1,
    editedBy: 1,
    createdBy: 1,
    creationDate: 1,
    updateDate: 1,
    position: 1,
    personnels: 1
};

module.exports = (req, res, next) => {
    function queryRun(body) {
        var aggregateHelper = new AggregationHelper($defProjection);

        async.waterfall([
            function (waterfallCb) {
                var pipeLine = [];
                var $match = {};
                var retailSegmentFilter;
                var outletFilter;

                if (body.country) {
                    body.country = body.country.length ? body.country : [body.country.length];
                    $match.country = {$in: body.country.objectID()};
                }

                if (body.region) {
                    body.region = body.region.length ? body.region : [body.region.length];
                    $match.region = {$in: body.region.objectID()};
                }

                if (body.subRegion) {
                    body.subRegion = body.subRegion.length ? body.subRegion : [body.subRegion.length];
                    $match.subRegion = {$in: body.subRegion.objectID()};
                }

                if (body.retailSegment) {
                    body.retailSegment = body.retailSegment.length ? body.retailSegment : [body.retailSegment.length];
                    retailSegmentFilter = {$in: body.retailSegment.objectID()};
                }

                if (body.outlet) {
                    body.outlet = body.outlet.length ? body.outlet : [body.outlet.length];
                    outletFilter = {$in: body.outlet.objectID()};
                }

                if (body.branch) {
                    body.branch = body.branch.length ? body.branch : [body.branch.length];
                    $match.branch = {$in: body.branch.objectID()};
                }

                if (body.personnel) {
                    body.personnel = body.personnel.length ? body.personnel : [body.personnel.length];
                    $match._id = {$in: body.personnel.objectID()};
                }

                if (body.position) {
                    body.position = body.position.length ? body.position : [body.position.length];
                    $match.position = {$in: body.position.objectID()};
                }

                pipeLine.push({
                    $match: $match
                });

                pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                    from         : 'accessRoles',
                    key          : 'accessRole',
                    isArray      : false,
                    addProjection: ['level']
                }));

                if (retailSegmentFilter || outletFilter) {
                    pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
                        from         : 'branches',
                        key          : 'branch',
                        isArray      : true,
                        addProjection: ['retailSegment', 'outlet']
                    }));

                    pipeLine.push({
                        $unwind: {
                            path                      : '$branch',
                            preserveNullAndEmptyArrays: true
                        }
                    });

                    if (retailSegmentFilter) {
                        pipeLine.push({
                            $match: {
                                'branch.retailSegment': retailSegmentFilter
                            }
                        })
                    }

                    if (outletFilter) {
                        pipeLine.push({
                            $match: {
                                'branch.outlet': outletFilter
                            }
                        })
                    }

                    pipeLine.push({
                        $group: aggregateHelper.getGroupObject({
                            branch: {
                                $addToSet: '$branch'
                            }
                        })
                    });

                }

                pipeLine.push({
                    $match: {
                        'accessRole.level': {
                            $nin: [
                                ACL_CONSTANTS.MASTER_ADMIN,
                                ACL_CONSTANTS.COUNTRY_ADMIN,
                                ACL_CONSTANTS.MASTER_UPLOADER,
                                ACL_CONSTANTS.COUNTRY_UPLOADER
                            ]
                        }
                    }
                });

                pipeLine.push({
                    $group: {
                        _id            : null,
                        personnelsIds  : {$addToSet: '$_id'},
                        personnelsCount: {
                            $sum: 1
                        },

                        branchesCount: {
                            $sum: {
                                $size: '$branch'
                            }
                        }
                    }
                });

                PersonnelModel.aggregate(pipeLine, function (err, result) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    result = result && result.length ? result[0] : {};

                    waterfallCb(null, result);
                });
            },
            function (resultObject, waterfallCb) {
                var personnelIds = resultObject.personnelsIds;
                var personnelCount = resultObject.personnelsCount;
                var branchCount = resultObject.branchesCount;
                var createdBy = {
                    user: req.session.uId,
                    date: new Date()
                };

                if (body.title) {
                    body.title = {
                        en: _.escape(body.title.en),
                        ar: _.escape(body.title.ar)
                    };
                }

                if (body.questions && body.questions.length) {
                    body.questions = _.map(body.questions, function (question) {
                        if (question.title) {
                            question.title = {
                                en: _.escape(question.title.en),
                                ar: _.escape(question.title.ar)
                            };
                        }
                        if (question.options && question.options.length) {
                            question.options = _.map(question.options, function (option) {
                                if (option) {
                                    return {
                                        en: _.escape(option.en),
                                        ar: _.escape(option.ar)
                                    };
                                }
                            });
                        }
                        return question;
                    });
                }

                body.countAll = personnelCount;
                body.countBranches = branchCount;
                body.status = 'draft';
                body.dueDate = new Date(body.dueDate);
                body.personnels = personnelIds;
                body.createdBy = createdBy;
                body.editedBy = createdBy;

                if (body.send) {
                    body.status = 'active';
                }

                ConsumersSurveyModel.create(body, function (err, result) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    event.emit('activityChange', {
                        module    : 31,
                        actionType: ACTIVITY_TYPES.CREATED,
                        createdBy : body.createdBy,
                        itemId    : result._id,
                        itemType  : CONTENT_TYPES.QUESTIONNARIES
                    });

                    waterfallCb(null, result._id);
                });
            },
            function (id, waterfallCb) {
                getByIdAggr({id: id}, waterfallCb);
            }
        ], function (err, result) {
            if (err) {
                return next(err);
            }

            next({status: 200, body: result});
        });
    }

    access.getWriteAccess(req, ACL_MODULES.CONSUMER_SURVEY, function (err) {
        if (err) {
            return next(err);
        }

        let body;

        try {
            if (req.body.data) {
                body = JSON.parse(req.body.data);
            } else {
                body = req.body;
            }
        } catch (err) {
            return next(err);
        }

        bodyValidator.validateBody(body, req.session.level, CONTENT_TYPES.CONSUMER_SURVEY, 'create', function (err, saveData) {
            if (err) {
                return next(err);
            }

            queryRun(saveData);
        });
    });

};
