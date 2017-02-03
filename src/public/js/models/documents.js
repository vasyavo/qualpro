define([
        'models/parrent',
        'validation',
        'moment',
        'constants/otherConstants',
        'dataService',
        'custom',
        'models/file',
        'constants/contentType',
        'constants/errorMessages'
    ],
    function (parent, validation, moment, otherConstants, dataService, custom, FileModel, CONTENT_TYPES, ERROR_MESSAGES) {

        var Model = parent.extend({

            initialize : function () {
                var lastEditDate;
                var editedBy = this.get('editedBy');

                if (editedBy) {
                    lastEditDate = editedBy.date;
                }

                if (lastEditDate) {
                    lastEditDate = moment(lastEditDate).format('DD.MM.YYYY');
                    this.set('dateString', lastEditDate);
                }
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

            saveFile : function (data) {
                var that = this;
                var errors = [];
                var currentLanguage = App.currentUser.currentLanguage;
                var body = JSON.parse(data.get('data'));
                var file = data.get('file');

                validation.checkTitleField(errors, true, body.title, 'Title');

                if (errors.length) {
                    return App.render({
                        type : 'error',
                        message : errors[0]
                    });
                }

                if (!file || file === 'null') {
                    return App.render({
                        type : 'error',
                        message : ERROR_MESSAGES.fileNotSelected[currentLanguage]
                    });
                }

                $.ajax({
                    url        : CONTENT_TYPES.DOCUMENTS,
                    type       : 'POST',
                    data       : data,
                    contentType: false,
                    processData: false,
                    success    : function (savedData) {
                        var fileModel = new FileModel();

                        savedData.attachments.type = fileModel.getTypeFromContentType(savedData.attachments.contentType);
                        savedData.attachments = [savedData.attachments];

                        that.trigger('saved', savedData);
                    },
                    error : function () {
                        return App.render({
                            type : 'error',
                            message : ERROR_MESSAGES.notSaved[currentLanguage]
                        });
                    }
                });
            },

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