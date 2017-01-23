const _ = require('lodash');
const async = require('async');
const CONSTANTS = require('./../constants/allowedBodyData');
const CONTENT_TYPE = require('./../public/js/constants/contentType');

const validationFunctions = {};
const validationFunctionsHelper = {};

validationFunctionsHelper.englishOrArabic = (value, key) => {
    if (value) {
        if (value.hasOwnProperty('en')) {
            key = key || {};
            key['en'] = _.escape(value.en);
        }

        if (value.hasOwnProperty('ar')) {
            key = key || {};
            key['ar'] = _.escape(value.ar);
        }
    }

    return !!key;
};

validationFunctions[CONTENT_TYPE.BRANDING_ACTIVITY] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'description')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.BRANDING_ACTIVITY_ITEMS] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.OBJECTIVES] = function(value, key, allowedObject) {
    if (_.includes([
            'title',
            'description',
            'companyObjective'
        ], key)) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key)
};

validationFunctions[CONTENT_TYPE.SHELFSHARES] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.INSTORETASKS] = function(value, key, allowedObject) {
    if (_.includes([
            'title',
            'description'
        ], key)) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.PERSONNEL] = function(value, key, allowedObject) {
    if (_.includes([
            'firstName',
            'lastName'
        ], key)) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.BRANCH] = function(value, key, allowedObject) {
    if (_.includes([
            'name',
            'address'
        ], key)) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.BRAND] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'name')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.VISIBILITYFORM] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.CATEGORY] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'name')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.COMPETITORITEM] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'name')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.COMPETITORVARIANT] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'name')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.DISTRIBUTIONFORM] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.DOMAIN] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'name')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.OUTLET] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'name')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.PLANOGRAM] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.ITEM] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'name')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.COMMENT] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.VARIANT] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'name')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.RETAILSEGMENT] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'name')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.RATING] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.NOTIFICATIONS] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'description')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.MONTHLY] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.PROMOTIONS] = function(value, key, allowedObject) {
    if (_.includes([
            'description',
            'title'
        ], key)) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.COMPETITORBRANDING] = function(value, key, allowedObject) {
    if (_.includes([
            'description',
            'location'
        ], key)) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.COMPETITORPROMOTION] = function(value, key, allowedObject) {
    if (_.includes([
            'description',
            'location'
        ], key)) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.ACHIEVEMENTFORM] = function(value, key, allowedObject) {
    if (_.includes([
            'description',
            'additionalComment',
            'location'
        ], key)) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.NEWPRODUCTLAUNCH] = function(value, key, allowedObject) {
    if (_.includes([
            'distributor',
            'additionalComment',
            'location'
        ], key)) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.PROMOTIONSITEMS] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.PRICESURVEY] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.BIYEARLY] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.CONTRACTSYEARLY] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'description')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.CONTRACTSSECONDARY] = function(value, key, allowedObject) {
    if (_.isEqual(key, 'description')) {
        return validationFunctionsHelper.englishOrArabic(value, key);
    }

    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.DOCUMENTS] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.NOTES] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.QUESTIONNARIES] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

validationFunctions[CONTENT_TYPE.CONSUMER_SURVEY] = function(value, key, allowedObject) {
    return _.includes(allowedObject, key);
};

const validateEachBody = (options, callback) => {
    let resultArray = [];
    const {
        data,
        level,
        contentType,
        method,
    } = options;

    async.each(data, (el, cb) => {
        validateBody(el, level, contentType, method, (err, val) => {
            if(err){
                return cb(err);
            }

            resultArray.push(val);
            cb(null);
        });
    }, (err)=> {
        if(err){
            return callback(err);
        }

        callback(null, resultArray);
    })
};

function validateBody(body, level, contentType, method, callback) {
    const allowedObject = CONSTANTS[contentType] &&
        CONSTANTS[contentType][level] &&
        CONSTANTS[contentType][level][method] || null;

    if (!allowedObject) {
        const error = new Error('Validation error');

        error.status = 400;
        return callback(error);
    }

    const allowedProps = {};

    for (let prop in body) {
        const propValue = body[prop];
        const isPropAllowed = validationFunctions[contentType](propValue, prop, allowedObject);

        if (isPropAllowed) {
            allowedProps[prop] = propValue;
        }
    }

    callback(null, allowedProps);
}

const validateBodyPromise = (args) => {
    const body = args.body;
    const accessRoleLevel = args.level;
    const contentType = args.contentType;
    const methodName = args.method;

    return new Promise((resolve, reject) => {
        validateBody(body, accessRoleLevel, contentType, methodName, (err, allowedData) => {
            if (err) {
                return reject(err);
            }

            resolve(allowedData);
        });
    });
};

module.exports = {
    validationFunctions,
    validateBody,
    validateEachBody,
    validateBodyPromise
};

