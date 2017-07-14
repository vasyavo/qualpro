var moment = require('moment');
var locales = require('moment/min/locales');
var parent = require('./parrent');
var validation = require('../validation');
var dataService = require('../dataService');
var CONTENT_TYPES = require('../constants/contentType');
var ERROR_MESSAGES = require('../constants/errorMessages');
var App = require('../appState');

module.exports = parent.extend({
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
    },

    editBody: function (commentId, newCommentBody) {
        var that = this;

        dataService.putData('/comment/' + commentId, {
            commentText: newCommentBody,
        }, function (err) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                    'Edit comment',
                ]);
            }

            that.trigger('comment-edited');
        });
    },

    delete: function (commentId) {
        var that = this;

        dataService.deleteData('/comment/' + commentId, {}, function (err) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                    'Delete comment',
                ]);
            }

            that.trigger('comment-deleted');
        });
    },
});
