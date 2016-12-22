const async = require('async');
const _ = require('underscore');
const event = require('../../../utils/eventEmitter');
const PersonnelModel = require('../../../types/personnel/model');
const ConsumersSurveyModel = require('../../../types/consumersSurvey/model');
const ACTIVITY_TYPES = require('../../../constants/activityTypes');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const bodyValidator = require('../../../helpers/bodyValidator');
const access = require('../../../helpers/access')();
const getByIdAggr = require('../reusable-components/getByIdAggr');

module.exports = (req, res, next) => {
    function queryRun(body) {
        var id = req.params.id;
        var fullUpdate = {
            $set: body
        };

        async.waterfall([
            function (waterfallCb) {
                var pipeLine = [];
                var $match = {};

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
                    $match.retailSegment = {$in: body.retailSegment.objectID()};
                }

                if (body.outlet) {
                    body.outlet = body.outlet.length ? body.outlet : [body.outlet.length];
                    $match.outlet = {$in: body.outlet.objectID()};
                }

                if (body.branch) {
                    body.branch = body.branch.length ? body.branch : [body.branch.length];
                    $match.branch = {$in: body.branch.objectID()};
                }

                if (Object.keys($match).length) {
                    pipeLine.push({
                        $match: $match
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
                } else {
                    return waterfallCb(null, {});
                }
            },
            function (resultObject, waterfallCb) {
                var personnelIds = resultObject.personnelsIds;
                var personnelCount = resultObject.personnelsCount;
                var branchCount = resultObject.branchesCount;

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

                if (body.dueDate) {
                    body.dueDate = new Date(body.dueDate);
                }

                if (personnelCount) {
                    body.countAll = personnelCount;
                    body.countBranches = branchCount;
                    body.personnels = personnelIds;
                }

                body.editedBy = {
                    user: req.session.uId,
                    date: new Date()
                };
                body.status = body.send ? 'active' : 'draft';

                ConsumersSurveyModel.findByIdAndUpdate(id, fullUpdate, {new: true}, function (err, result) {
                    if (err) {
                        return waterfallCb(err);
                    }

                    event.emit('activityChange', {
                        module    : ACL_MODULES.CONSUMER_SURVEY,
                        actionType: ACTIVITY_TYPES.UPDATED,
                        createdBy : body.editedBy,
                        itemId    : id,
                        itemType  : CONTENT_TYPES.CONSUMER_SURVEY
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
