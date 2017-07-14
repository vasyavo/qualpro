var parent = require('./parrent');
var validation = require('../validation');
var CONTENT_TYPES = require('../constants/contentType');
var App = require('../appState');

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
            validation.checkDomainNameField(errors, true, attrs.name[App.currentUser.currentLanguage], this.translatedFields.name);
        }

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return CONTENT_TYPES.BRAND;
    }
});
