var _ = require('underscore');
var parent = require('./parrent');
var validation = require('../validation');
var CONTENT_TYPES = require('../constants/contentType');
var CONSTANTS = require('../constants/otherConstants');
var App = require('../appState');

module.exports = parent.extend({

    fieldsToTranslate: [
        'title',
        'dueDate',
        'startDate',
        'questions',
        'location'
    ],

    urlRoot: function () {
        return CONTENT_TYPES.CONSUMER_SURVEY;
    },

    validate: function (attrs, cb) {
        var errors = [];
        var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';

        if (this.translatedFields.title) {
            validation.checkTitleField(errors, true, attrs.title, this.translatedFields.title);
        }
        if (this.translatedFields.dueDate) {
            validation.checkForValuePresence(errors, true, attrs.dueDate, this.translatedFields.dueDate);
        }
        if (this.translatedFields.startDate) {
            validation.checkForValuePresence(errors, true, attrs.startDate, this.translatedFields.startDate);
        }
        if (this.translatedFields.questions) {
            validation.checkForValuePresence(errors, true, attrs.questions, this.translatedFields.questions);
        }
        if (this.translatedFields.location) {
            validation.checkDescriptionField(errors, true, attrs.location, this.translatedFields.location);
        }

        if (errors.length > 0) {
            return cb(errors);
        }
        return cb(null);
    },

    modelParse: function (model) {
        var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
        var statuses = CONSTANTS.CONTRACTS_UI_STATUSES;
        var status = _.findWhere(statuses, {_id: model.status});

        model.status = status;
        model.status.name.currentLanguage = model.status.name[currentLanguage];
        model.statusClass = status._id + 'Status';
        model.title.currentLanguage = model.title[currentLanguage];


        model.questions = _.map(model.questions, function (question) {
            _.map(CONSTANTS.QUESTION_TYPE, function (type) {
                if (question.type === type._id) {
                    question.type = type;
                    question.type.name.currentLanguage = question.type.name[currentLanguage];
                }
            });
            if (question.title) {
                question.title.currentLanguage = question.title[currentLanguage];
            }
            question.options = _.map(question.options, function (option) {
                option.currentLanguage = option[currentLanguage];

                return option;
            });

            return question;
        });

        return model;
    }
});
