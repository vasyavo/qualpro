var parent = require('./parrent');
var validation = require('../validation');
var dataService = require('../dataService');
var CONTENT_TYPES = require('../constants/contentType');
var ERROR_MESSAGES = require('../constants/errorMessages');

module.exports = parent.extend({
    defaults: {},

    fieldsToTranslate: [
        'name'
    ],

    multilanguageFields: [
        'name'
    ],

    validate: function (attrs) {
        var errors = [];

        if(this.translatedFields.name){
            validation.checkNameField(errors, true, attrs.name, this.translatedFields.name);
        }

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return CONTENT_TYPES.CATEGORY;
    },

    updateCategoryInformation: function (category, arrayOfFilesId) {
        var that = this;

        dataService.putData('/category', {
            products: [category],
            information: arrayOfFilesId
        }, function (err) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage]
                ]);
            }

            that.trigger('category-information-updated');
        });
    }
});
