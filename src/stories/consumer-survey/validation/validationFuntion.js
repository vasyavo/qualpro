const _ = require('lodash');
const CONTENT_TYPE = require('./../../../public/js/constants/contentType');
const BodyValidator = require('./../../../helpers/bodyValidator');
const validationFunctions = BodyValidator.validationFunctions;

validationFunctions[CONTENT_TYPE.CONSUMER_SURVEY] = (value, key, allowedObject) => {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.CONSUMER_SURVEY_ANSWER] = (value, key, allowedObject) => {
    return _.includes(allowedObject, key);
};

module.exports = validationFunctions;
