var parent = require('./parrent');
var validation = require('../validation');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
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
        return CONTENT_TYPES.COMPETITORVARIANT;
    }
});
