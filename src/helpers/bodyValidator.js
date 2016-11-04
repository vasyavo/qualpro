'use strict';

var _ = require('lodash');
var CONSTANTS = require('../constants/allowedBodyData');
var CONTENT_TYPE = require('../public/js/constants/contentType');

var BodyValidator = (function() {
    var error;
    var validationFunctions = {};
    var validationFunctionsHelper = {};

    validationFunctionsHelper.englishOrArabic = function(value, key) {
        key = null;

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

    validationFunctions[CONTENT_TYPE.BRANDINGANDDISPLAY] = function(value, key, allowedObject) {
        if (_.isEqual(key, 'description')) {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return _.includes(allowedObject, key);
    };

    validationFunctions[CONTENT_TYPE.BRANDINGANDDISPLAYITEMS] = function(value, key, allowedObject) {
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
        return !_.includes(allowedObject, key);
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

    return {
        validateBody : validateBody
    };
})();

module.exports = BodyValidator;
