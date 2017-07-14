var parent = require('./parrent');
var validation = require('../validation');
var dataService = require('../dataService');
var CONSTANTS = require('../constants/otherConstants');
var ERROR_MESSAGES = require('../constants/errorMessages');
var App = require('../appState');

module.exports = parent.extend({

    defaults: {
        selected            : true,
        selectedForPersonnel: true
    },

    urlRoot: function () {
        return '/consumersSurvey/answer';
    },

    modelParse: function (model) {
        var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';

        if (model.optionIndex && model.optionIndex.length && model.type !== 'NPS') {
            model.optionIndex.forEach(function (option, iterator) {
                model.optionIndex[iterator] = ++option;
            });
        }

        if (model.text) {
            model.text.currentLanguage = model.text[currentLanguage];
        }

        _.map(CONSTANTS.QUESTION_TYPE, function (type) {
            if (model.type === type._id) {
                model.type = type;
                model.type.name.currentLanguage = model.type.name[currentLanguage];
            }
        });

        return model;
    },

    edit: function (answerId, data) {
        var that = this;

        dataService.putData('/consumersSurvey/answer/' + answerId, data, function (err) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                    'Edit answer of consumer survey',
                ]);
            }

            that.trigger('answer-edited');
        });
    },

    delete: function (answerId) {
        var that = this;

        dataService.deleteData('/consumersSurvey/answer/' + answerId, {}, function (err) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                    'Delete answer of consumer survey',
                ]);
            }

            that.trigger('answer-deleted');
        });
    }
});
