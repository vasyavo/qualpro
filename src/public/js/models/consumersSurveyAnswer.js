define([
    'models/parrent',
    'validation',
    'constants/otherConstants'
], function (parent, validation, CONSTANTS) {
    var Model = parent.extend({

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
        }
    });

    return Model;
});
