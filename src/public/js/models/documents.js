define([
        'models/parrent',
        'validation',
        'constants/otherConstants',
        'dataService',
        'custom',
        'models/file',
        'constants/contentType'
    ],
    function (parent, validation, otherConstants, dataService, custom, FileModel, CONTENT_TYPES) {
        'use strict';

        var Model = parent.extend({
            defaults      : {},
            attachmentsKey: 'attachments',

            fieldsToTranslate: [
                'title',
                'attachments'
            ],

            multilanguageFields: [
                'createdBy.user.firstName',
                'createdBy.user.lastName',
                'createdBy.user.accessRole.name',
                'createdBy.user.position.name'
            ],

            urlRoot: function () {
                return CONTENT_TYPES.DOCUMENTS;
            },

            validate: function (attrs, cb) {
                var errors = [];

                if (this.translatedFields.title) {
                    validation.checkTitleField(errors, true, attrs.title, this.translatedFields.title);
                }
                if (this.translatedFields.attachments) {
                    validation.checkForValuePresence(errors, true, attrs.attachments, this.translatedFields.attachments);
                }

                if (errors.length > 0) {
                    return cb(errors);
                }
                return cb(null);
            }

        });

        return Model;
    });