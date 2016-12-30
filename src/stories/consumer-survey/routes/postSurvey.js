const wrap = require('co-express');
const AccessManager = require('./../../../helpers/access')();
const BodyValidator = require('./../../../helpers/bodyValidator');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');
const ConsumerSurveyModel = require('./../types/survey/model');
const logger = require('./../../../utils/logger');

module.exports = wrap(function * (req, res, next) {
    const body = req.body;
    const accessRoleLevel = req.session.level;
    const aclModule = ACL_MODULES.CONSUMER_SURVEY;
    const contentType = CONTENT_TYPES.CONSUMER_SURVEY;

    yield AccessManager.getWriteAccessPromise(req, aclModule);
    const allowedData = yield BodyValidator.validateBodyPromise({
        body,
        level: accessRoleLevel,
        contentType,
        method: 'create'
    });

    let populatedSurvey;

    try {
        const newSurvey = new ConsumerSurveyModel();

        newSurvey.set(allowedData);

        const savedSurvey = yield newSurvey.save();

        populatedSurvey = yield ConsumerSurveyModel.findById(savedSurvey._id)
            .populate('country region subRegion retailSegment outlet branch createdBy.user editedBy.user')
            .lean()
            .exec();
    } catch (ex) {
        logger.error('Consumer survey was not saved', ex);

        throw ex;
    }

    res.status(200).send(populatedSurvey);
});
