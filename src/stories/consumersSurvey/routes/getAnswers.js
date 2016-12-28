const _ = require('underscore');
const lodash = require('lodash');
const mongoose = require('mongoose');
const CONTENT_TYPES = require('../../../public/js/constants/contentType.js');
const FilterMapper = require('../../../helpers/filterMapper');
const AggregationHelper = require('../../../helpers/aggregationCreater');
const ConsumersSurveyAnswersModel = require('../../../types/consumersSurveyAnswers/model');
const GetImageHelper = require('../../../helpers/getImages');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const access = require('../../../helpers/access')();
const ObjectId = mongoose.Types.ObjectId;

const getImagesHelper = new GetImageHelper();

const $defProjection = {
    _id: 1,
    questionnaryId: 1,
    questionId: 1,
    optionIndex: 1,
    editedBy: 1,
    createdBy: 1,
    branch: 1,
    outlet: 1,
    retailSegment: 1,
    subRegion: 1,
    region: 1,
    country: 1,
    text: 1,
    position: 1,
    customer : 1
};

module.exports = (req, res, next) => {
    function queryRun(personnel) {
        var query = req.query;
        var pipeLine = [];
        var filterMapper = new FilterMapper();
        var filter = filterMapper.mapFilter({
            contentType: CONTENT_TYPES.CONSUMER_SURVEY_ANSWER,
            personnel  : personnel
        });
        var aggregateHelper = new AggregationHelper($defProjection, filter);
        var saveObj = {
            questionnaryId: ObjectId(query.questionnaryId)
        };
        var aggregation;

        if (query.questionId) {
            saveObj.questionId = ObjectId(query.questionId);
        }

        pipeLine.push({
            $match: saveObj
        });

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from   : 'positions',
            key    : 'position',
            isArray: false
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'country'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'region'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'domains',
            key : 'subRegion'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'retailSegments',
            key : 'retailSegment'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'outlets',
            key : 'outlet'
        }));

        pipeLine = _.union(pipeLine, aggregateHelper.aggregationPartMaker({
            from: 'branches',
            key : 'branch'
        }));

        aggregation = ConsumersSurveyAnswersModel.aggregate(pipeLine);

        aggregation.options = {
            allowDiskUse: true
        };

        aggregation.exec(function (err, response) {
            if (!response.length) {
                return next({status: 200, body: []});
            }

            next({status: 200, body: response});
        });
    }

    access.getReadAccess(req, ACL_MODULES.CONSUMER_SURVEY, function (err, allowed, personnel) {
        if (err) {
            return next(err);
        }

        if (!allowed) {
            err = new Error();
            err.status = 403;

            return next(err);
        }

        queryRun(personnel);
    });
};
