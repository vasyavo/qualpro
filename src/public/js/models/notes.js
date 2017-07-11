var parent = require('./parrent');
var validation = require('../validation');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    defaults: {},

    fieldsToTranslate  : [
        'description',
        'theme',
        'title'
    ],
    multilanguageFields: [
        'createdBy.user.firstName',
        'createdBy.user.lastName',
        'createdBy.user.accessRole.name',
        'createdBy.user.position.name'
    ],

    validate: function (attrs, cb) {
        var errors = [];

        if (this.translatedFields.description) {
            validation.checkDescriptionField(errors, true, attrs.description, this.translatedFields.description);
        }
        if (this.translatedFields.theme) {
            validation.checkDescriptionField(errors, true, attrs.theme, this.translatedFields.theme);
        }
        if (this.translatedFields.title) {
            validation.checkTitleField(errors, true, attrs.title, this.translatedFields.title);
        }

        if (errors.length > 0) {
            return cb(errors);
        }
        return cb();
    },

    urlRoot: function () {
        return CONTENT_TYPES.NOTES;
    }
});
