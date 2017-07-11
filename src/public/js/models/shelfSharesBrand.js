var parent = require('./parrent');
var dataService = require('../dataService');
var CONTENT_TYPES = require('../constants/contentType');
var ERROR_MESSAGES = require('../constants/errorMessages');

module.exports = parent.extend({
    idAttribute: '_id',

    multilanguageFields: [
        'branch.name',
        'brand.name',
        'category.name',
        'employee.name'
    ],

    urlRoot: function () {
        return CONTENT_TYPES.SHELFSHARES;
    },

    editValueOfShelfSharesItem: function (options) {
        var that = this;
        dataService.putData('/shelfShares/' + options.shelfSharesId + '/item/' + options.shelfSharesItemId, {
            length: options.value,
        }, function (err) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                    'Edit shelf share item value',
                ]);
            }

            that.trigger('shelf-shares-value-edited');
        });
    },

    deleteItem: function (priceSurveyId, itemId) {
        var that = this;

        dataService.deleteData('/shelfShares/' + priceSurveyId + '/item/' + itemId, {}, function (err) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                    'Delete shelf share item',
                ]);
            }

            that.trigger('shelf-shares-value-deleted');
        });
    }
});
