var parent = require('./parrent');
var validation = require('../validation');
var CONTENT_TYPES = require('../constants/contentType');
var ERROR_MESSAGES = require('../constants/errorMessages');
var App = require('../appState');

module.exports = parent.extend({
    defaults: {
        imageSrc: '',
        name    : {
            ar: '',
            en: ''
        }
    },

    fieldsToTranslate: [
        'name'
    ],

    multilanguageFields: [
        'name',
        'createdBy.user.firstName',
        'createdBy.user.lastName'
    ],

    validate: function (attrs) {
        var currentLanguage = App.currentUser.currentLanguage;
        var errors = [];

        if(this.translatedFields.name) {
            var fieldValue = attrs.name[App.currentUser.currentLanguage];

            if (!fieldValue) {
                errors.push(ERROR_MESSAGES.country.emptyNameInput[currentLanguage]);
            } else if (validation.hasInvalidChars(fieldValue)) {
                errors.push(ERROR_MESSAGES.invalidChars[currentLanguage]);
            }
        }

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return CONTENT_TYPES.COUNTRY;
    }
});
