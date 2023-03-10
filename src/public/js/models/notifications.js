var parent = require('./parrent');
var validation = require('../validation');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({

    fieldsToTranslate: [
        'country',
        'description'
    ],

    multilanguageFields: [
        'description',
        'country.name',
        'region.name',
        'subRegion.name',
        'outlet.name',
        'retailSegment.name',
        'branch.name'
    ],

    validate: function (attrs) {
        var errors = [];

        if(this.translatedFields.description){
            validation.checkDescriptionField(errors, true, attrs.description, this.translatedFields.description);
        }

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return CONTENT_TYPES.NOTIFICATIONS;
    }
});
