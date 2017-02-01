define([
        'models/parrent',
        'validation',
        'moment',
        'constants/otherConstants',
        'dataService',
        'custom',
        'models/file',
        'constants/contentType'
    ],
    function (parent, validation, moment, otherConstants, dataService, custom, FileModel, CONTENT_TYPES) {

        var Model = parent.extend({

            initialize : function () {
              var lastEditDate = this.get('editedBy').date;
              lastEditDate = moment(lastEditDate).format('DD.MM.YYYY');
              this.set('dateString', lastEditDate);
            },

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