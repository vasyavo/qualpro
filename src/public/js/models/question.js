var parent = require('./parrent');
var validation = require('../validation');

module.exports = parent.extend({

    fieldsToTranslate: [
        'title',
        'type',
        'options'
    ],

    urlRoot: function () {
        return '/question';
    },

    validate: function (attrs, cb) {
        var that = this;
        var errors = [];
        var optionsRequired = (attrs.type !== 'fullAnswer' && attrs.type !== 'NPS');

        if (this.translatedFields.title) {
            validation.checkTitleField(errors, true, attrs.title, this.translatedFields.title);
        }
        if (this.translatedFields.type) {
            validation.checkForValuePresence(errors, true, attrs.type, this.translatedFields.type);
        }
        if (this.translatedFields.options && optionsRequired) {
            attrs.options.forEach(function (value) {
                validation.checkTitleField(errors, true, value, that.translatedFields.options);
            });
        }

        if (errors.length > 0) {
            return cb(errors);
        }

        return cb(null);
    }
});
