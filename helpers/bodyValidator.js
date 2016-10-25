'use strict';

var _ = require('lodash');
var CONSTANTS = require('../constants/allowedBodyData');
var CONTENT_TYPE = require('../public/js/constants/contentType');

var BodyValidator = (function () {
    var error;
    var validationFunctions = {};
    var validationFunctionsHelper = {};

    validationFunctionsHelper.englishOrArabic = function (value, key) {
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

    validationFunctions[CONTENT_TYPE.BRANDINGANDDISPLAY] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'description') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.BRANDINGANDDISPLAYITEMS] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.OBJECTIVES] = function (value, key, allowedObject) {
        if (!_.includes(allowedObject, key)) {
            return false;
        }

        if (_.includes(['title', 'description', 'companyObjective'], key)) {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.SHELFSHARES] = function (value, key, allowedObject) {
        return !(allowedObject.indexOf(key) === -1);
    };

    validationFunctions[CONTENT_TYPE.INSTORETASKS] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'title' || key === 'description') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.PERSONNEL] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'firstName' || key === 'lastName') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.BRANCH] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name' || key === 'address') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.BRAND] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.VISIBILITYFORM] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.CATEGORY] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.COMPETITORITEM] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.COMPETITORVARIANT] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.DISTRIBUTIONFORM] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.DOMAIN] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.OUTLET] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.PLANOGRAM] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.ITEM] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.COMMENT] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.VARIANT] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.RETAILSEGMENT] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'name') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.RATING] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.NOTIFICATIONS] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'description') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.MONTHLY] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.PROMOTIONS] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'title' || key === 'description') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.COMPETITORBRANDING] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'description' || key === 'location') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.COMPETITORPROMOTION] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'description' || key === 'location') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.ACHIEVEMENTFORM] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'description' || key === 'additionalComment' || key === 'location') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.NEWPRODUCTLAUNCH] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'distributor' || key === 'additionalComment' || key === 'location') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.PROMOTIONSITEMS] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.PRICESURVEY] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.BIYEARLY] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.CONTRACTSYEARLY] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'description') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.CONTRACTSSECONDARY] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        if (key === 'description') {
            return validationFunctionsHelper.englishOrArabic(value, key);
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.DOCUMENTS] = function (value, key, allowedObject) {
        return _.includes(allowedObject, key);
    };

    validationFunctions[CONTENT_TYPE.NOTES] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    validationFunctions[CONTENT_TYPE.QUESTIONNARIES] = function (value, key, allowedObject) {
        if (allowedObject.indexOf(key) === -1) {
            return false;
        }

        return true;
    };

    function validateBody(body, level, contentType, method, callback) {
        var saveObj;
        var allowedObject = CONSTANTS[contentType] && CONSTANTS[contentType][level] && CONSTANTS[contentType][level][method] || null;

        if (!allowedObject) {
            error = new Error('Validation error');
            error.status = 400;
            return callback(error);
        }

        saveObj = _.pickBy(body, function (value, key) {
            return validationFunctions[contentType](value, key, allowedObject);
        });


        callback(null, saveObj);
    }

    return {
        validateBody: validateBody
    };
})();

module.exports = BodyValidator;
