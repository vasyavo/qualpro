var parent = require('./parrent');
var dataService = require('../dataService');
var CONTENT_TYPES = require('../constants/contentType');
var ERROR_MESSAGES = require('../constants/errorMessages');
var App = require('../appState');

module.exports = parent.extend({
    defaults      : {},
    attachmentsKey: 'attachments',

    multilanguageFields: [
        'distributor',
        'additionalComment',
        'location',
        'createdBy.user.firstName',
        'createdBy.user.lastName',
        'createdBy.user.accessRole.name',
        'createdBy.user.position.name',
        'country.name',
        'region.name',
        'subRegion.name',
        'retailSegment.name',
        'outlet.name',
        'branch.name',
        'category.name',
        'variant.name',
        'brand.name',
        'origin.name',
        'displayType.name'
    ],

    validate: function (attrs) {
        var errors = [];

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return CONTENT_TYPES.NEWPRODUCTLAUNCH;
    },

    modelParse: function (model) {
        model.displayTypeString = model.displayType.map(function(model) {
            return model.name.currentLanguage;
        }).join(', ');

        return model;
    },

    edit: function (newProductLaunchId, data) {
        var that = this;
        var currentLanguage = App.currentUser.currentLanguage;

        dataService.putData('/newProductLaunch/' + newProductLaunchId, data, function (err, response) {
            if (err) {
                return App.renderErrors([
                    err.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                ]);
            }

            that.trigger('new-product-launch-edited', response);
        });
    },

    delete: function (newProductLaunchId) {
        var that = this;

        dataService.deleteData('/newProductLaunch/' + newProductLaunchId, {}, function (err) {
            if (err) {
                return App.renderErrors([
                    err.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                ]);
            }

            that.trigger('new-product-launch-deleted');
        });
    }

});
