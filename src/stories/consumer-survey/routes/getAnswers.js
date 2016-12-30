const wrap = require('co-express');
const mongoose = require('mongoose');
const _ = require('lodash');
const AccessManager = require('./../../../helpers/access')();
const BodyValidator = require('./../../../helpers/bodyValidator');
const ImageHelper = require('./../../../helpers/getImages');
const FilterMapper = require('./../../../helpers/filterMapper');
const AggregationHelper = require('./../../../helpers/aggregationCreater');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONSTANTS = require('./../../../constants/mainConstants');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const AnswerModel = require('./../types/answer/model');
const logger = require('./../../../utils/logger');
const ObjectId = mongoose.Types.ObjectId;
const imageHelper = new ImageHelper();

const $answerDefProjection = {
    _id: 1,
    personnel: 1,
    personnelId: 1,
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
    position: 1
};

module.exports = wrap(function * (req, res, next) {
    const aclModule = ACL_MODULES.CONSUMER_SURVEY;
    const personnel = yield AccessManager.getWriteAccessPromise(req, aclModule);

    const query = req.query;

    const filterMapper = new FilterMapper();
    const filter = filterMapper.mapFilter({
        contentType: CONTENT_TYPES.CONSUMER_SURVEY_ANSWER,
        personnel
    });
    const aggregateHelper = new AggregationHelper($answerDefProjection, filter);
    const pipeline = [];

    const $match = {
        surveyId: ObjectId(query.surveyId),
    };

    if (query.questionId) {
        $match.questionId = ObjectId(query.questionId);
    }

    pipeline.push({
        $match
    });

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'personnels',
        key: 'personnelId',
        as: 'personnel',
        isArray: false,
        addProjection: ['firstName', 'lastName'],
        addMainProjection: ['position']
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'positions',
        key: 'position',
        isArray: false
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'country'
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'region'
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'domains',
        key: 'subRegion'
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'retailSegments',
        key: 'retailSegment'
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'outlets',
        key: 'outlet'
    }));

    pipeline.push(...aggregateHelper.aggregationPartMaker({
        from: 'branches',
        key: 'branch'
    }));

    const aggreagationResult = AnswerModel
        .aggregate(pipeline)
        .allowDiskUse(true)
        .exec();

    if (!aggreagationResult.length) {
        return next({ status: 200, body: [] });
    }

    const personnelIds = [];

    _.forEach(aggreagationResult, (answer) => {
        if (answer.text) {
            answer.text = {
                en: _.unescape(answer.text.en),
                ar: _.unescape(answer.text.ar),
            }
        }

        personnelIds.push(answer.personnel._id);
    });

    const images = yield imageHelper.getImagesPromise({
        data: {
            [CONTENT_TYPES.PERSONNEL]: _.uniqBy(personnelIds, '_id'),
        },
    });
    const response = yield imageHelper.setIntoResultPromise({
        response: images,
        imgsObject: aggreagationResult,
        fields: {
            [CONTENT_TYPES.PERSONNEL]: ['personnel'],
        },
    });

    next({
        status: 200,
        body: response
    });
});
