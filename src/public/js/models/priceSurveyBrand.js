var parent = require('./parrent');
var dataService = require('../dataService');
var CONTENT_TYPES = require('../constants/contentType');
var ERROR_MESSAGES = require('../constants/errorMessages');
var App = require('../appState');

module.exports = parent.extend({
    idAttribute: '_id',

    multilanguageFields: [
        'branch.name',
        'brand.name',
        'category.name',
        'employee.name'
    ],

    urlRoot: function () {
        return CONTENT_TYPES.PRICESURVEY + '/brands';
    },

    editValueOfPriceSurveyItem: function (options) {
        var that = this;

        dataService.putData('/priceSurvey/' + options.priceSurveyId + '/item/' + options.priceSurveyItemId, {
            price: options.price,
        }, function (err) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                    'Edit price survey item value',
                ]);
            }

            that.trigger('price-survey-value-edited');
        });
    },

    deleteItem: function (priceSurveyId, itemId) {
        var that = this;

        dataService.deleteData('/priceSurvey/' + priceSurveyId + '/item/' + itemId, {}, function (err) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                    'Delete price survey item',
                ]);
            }

            that.trigger('price-survey-item-deleted');
        });
    }

});
