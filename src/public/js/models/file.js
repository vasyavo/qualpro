var $ = require('jquery');
var Backbone = require('backbone');
var dataService = require('../dataService');
var otherConstants = require('../constants/otherConstants');
var ERROR_MESSAGES = require('../constants/errorMessages');
var App = require('../appState');

module.exports = Backbone.Model.extend({
    idAttribute: '_id',

    url: 'file',

    initialize: function () {
        this.on('invalid', function (model, errors) {
            App.renderErrors(errors);
        });
    },

    validate: function (attrs) {
        var errors = [];

        if (errors.length > 0) {
            return errors;
        }
    },

    getUrl: function (bucket, cb) {
        dataService.getData('file/' + bucket + '/' + this.get('_id'), {}, cb);
    },

    getTypeFromContentType: function (contentType) {
        if (otherConstants.IMAGE_CONTENT_TYPES.indexOf(contentType) !== -1) {
            return 'image_icon';
        } else if (otherConstants.VIDEO_CONTENT_TYPES.indexOf(contentType) !== -1) {
            return 'video_icon';
        } else if (otherConstants.MS_WORD_CONTENT_TYPES.indexOf(contentType) !== -1) {
            return 'word_icon';
        } else if (otherConstants.MS_EXCEL_CONTENT_TYPES.indexOf(contentType) !== -1) {
            return 'excel_icon';
        } else {
            return 'pdf_icon';
        }
    },

    update: function (options) {
        var file = options.file;
        var uploaded = options.uploaded;
        var selected = options.selected;

        file.uploaded = true;
        file.selected = !!selected;

        if (!uploaded) {
            file.uploaded = false;
        }

        if (!file.contentType) {
            file.contentType = file.type;
        }

        file.type = this.getTypeFromContentType(file.contentType);

        this.set('type', file.type);
        this.set('createdBy', file.createdBy);
        this.set('contentType', file.contentType);
        this.set('uploaded', file.uploaded);
        this.set('selected', file.selected);
        this.set('name', file.originalName || file.name);
        this.set('_id', file._id);
        this.set('preview', file.preview);
        this.set('document', file.document || null);
    },

    parse: function (model) {
        model.type = this.getTypeFromContentType(model.contentType);

        return model;
    },

    uploadFile: function (file) {
        var that = this;
        var formData = new FormData();
        formData.append('file', file);

        $.ajax({
            url : '/file',
            method : 'POST',
            data : formData,
            contentType: false,
            processData: false,
            success : function (response) {
                that.trigger('file-uploaded', response);
            },
            error : function () {
                App.renderErrors([
                    ERROR_MESSAGES.fileIsNotUploaded[App.currentUser.currentLanguage]
                ]);
            }
        });
    }

});
