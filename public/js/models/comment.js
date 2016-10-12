define([
    'models/parrent',
    'validation',
    'constants/contentType',
    'moment',
    'locales'
], function (parent, validation, CONTENT_TYPES, moment, locales) {
    var Model = parent.extend({
        defaults      : {},
        attachmentsKey: 'attachments',

        fieldsToTranslate: [
            'commentText'
        ],

        multilanguageFields: [
            'createdBy.user.firstName',
            'createdBy.user.lastName',
            'createdBy.user.accessRole.name'
        ],

        validate: function (attrs, cb) {
            var errors = [];

            if (this.translatedFields.commentText) {
                validation.checkDescriptionField(errors, true, attrs.commentText, this.translatedFields.commentText);
            }

            if (errors.length > 0) {
                return cb(errors);
            }
            return cb();
        },

        urlRoot: function () {
            return CONTENT_TYPES.COMMENT;
        },

        modelParse: function (model) {
            var userName;
            if (model.createdBy && model.createdBy.diffDate) {
                moment.locale(App.currentUser.currentLanguage, locales);
                model.createdBy.diffDate = moment.duration(model.createdBy.diffDate * -1).humanize(true);
            }
            if (model.attachments.length) {
                userName = model.createdBy.user.firstName.currentLanguage + ' ' + model.createdBy.user.lastName.currentLanguage;
                model.attachments.forEach(function (attachment) {
                    attachment.userName = userName;
                });
            }

            return model;
        }
    });

    return Model;
});
