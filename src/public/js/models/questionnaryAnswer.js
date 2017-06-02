define([
    'models/parrent',
    'validation',
    'constants/otherConstants',
    'constants/errorMessages',
    'dataService',
], function (parent, validation, CONSTANTS, ERROR_MESSAGES, dataService) {
    var Model = parent.extend({

        defaults: {
            selected            : true,
            selectedForPersonnel: true
        },

        urlRoot: function () {
            return '/questionnary/answer';
        },

        modelParse: function (model) {
            var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';

            if (model.optionIndex && model.optionIndex.length) {
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

            dataService.putData('/questionnary/answer/' + answerId, data, function (err) {
                if (err) {
                    return App.renderErrors([
                        ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                        'Edit answer of question',
                    ]);
                }

                that.trigger('answer-edited');
            });
        },

        delete: function (answerId) {
            var that = this;

            dataService.deleteData('/questionnary/answer/' + answerId, {}, function (err) {
                if (err) {
                    return App.renderErrors([
                        ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage],
                        'Delete answer of question',
                    ]);
                }

                that.trigger('answer-deleted');
            });
        }
    });

    return Model;
});
