var async = require('async');
var moment = require('moment');
var parent = require('./parrent');
var validation = require('../validation');
var dataService = require('../dataService');
var custom = require('../custom');
var FileModel = require('./file');
var CONTENT_TYPES = require('../constants/contentType');
var otherConstants = require('../constants/otherConstants');
var ERROR_MESSAGES = require('../constants/errorMessages');

module.exports = parent.extend({

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

        var attachment = this.get('attachment');

        if (attachment) {
            var fileModel = new FileModel();

            attachment.type = fileModel.getTypeFromContentType(attachment.contentType);
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

    saveFile : function (formData, body) {
        var that = this;
        var errors = [];
        var currentLanguage = App.currentUser.currentLanguage;
        var file = formData.get('file');

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

        async.waterfall([

            function (cb) {
                $.ajax({
                    url : '/file',
                    method : 'POST',
                    data : formData,
                    contentType: false,
                    processData: false,
                    success : function (response) {
                        cb(null, response);
                    },
                    error : function () {
                        cb(true);
                    }
                });
            },

            function (fileObj, cb) {
                body.attachment = fileObj.files[0]._id;

                $.ajax({
                    url        : CONTENT_TYPES.DOCUMENTS,
                    method       : 'POST',
                    data       : body,
                    dataType : 'json',
                    success    : function (savedData) {
                        cb(null, savedData);
                    },
                    error : function () {
                        cb(true);
                    }
                });
            }

        ], function (err, savedData) {
            if (err) {
                return App.render({
                    type : 'error',
                    message : ERROR_MESSAGES.notSaved[currentLanguage]
                });
            }

            var fileModel = new FileModel();

            savedData.attachment.type = fileModel.getTypeFromContentType(savedData.attachment.contentType);
            savedData.attachments = [savedData.attachment];

            that.trigger('saved', savedData);
        });
    },

    saveFolder : function (data) {
        var that = this;
        var errors = [];
        var currentLanguage = App.currentUser.currentLanguage;

        validation.checkTitleField(errors, true, data.title, 'Title');

        if (errors.length) {
            return App.render({
                type : 'error',
                message : errors[0]
            });
        }

        $.ajax({
            url : CONTENT_TYPES.DOCUMENTS,
            method : 'POST',
            data : data,
            dataType : 'json',
            success    : function (savedData) {
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

    updateTitle : function (modelId, data) {
        var that = this;
        var errors = [];

        validation.checkTitleField(errors, true, data.title, 'Title');

        if (errors.length) {
            return App.render({
                type : 'error',
                message : errors[0]
            });
        }

        $.ajax({
            url : CONTENT_TYPES.DOCUMENTS + '/' + modelId,
            method : 'PUT',
            data : data,
            dataType : 'json',
            success    : function (savedData) {
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
