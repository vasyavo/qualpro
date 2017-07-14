var _ = require('underscore');
var Parent = require('../parrent');
var Model = require('../../models/consumersSurveyAnswer');

module.exports = Parent.extend({
    model      : Model,
    url        : '/consumersSurvey/answer',
    viewType   : null,
    contentType: null,

    getAnswerCount: function (questionIdFroUi, optionIndex) {
        optionIndex = ++optionIndex;
        return _.filter(this.toJSON(), function (answer) {
            return answer.questionId === questionIdFroUi && answer.optionIndex.indexOf(optionIndex) !== -1;
        }).length;
    },

    getAnswerFromPersonnels: function () {
        var collection = this.toJSON();
        var answers = [];
        var personnelsIds = [];

        collection.forEach(function (answer) {
            if (answer.customer && personnelsIds.indexOf(answer.customer.name) === -1 && answer.selectedForPersonnel) {
                personnelsIds.push(answer.customer.name);
                answers.push(answer);
            }
        });

        return answers;
    },

    getSelected: function (options) {
        var self = this;

        return _.filter(this.toJSON(), function (model) {

            if (model.questionId === self.questionId && options.modelKey === 'selected') {
                return model[options.modelKey];
            }

            if (model.customer.name === self.customerName && options.modelKey === 'selectedForPersonnel') {
                return true;
            }

            return false;
        });
    },

    search: function (options) {
        var text = options.text || '';
        var regex = new RegExp(text, 'i');
        var modelKey = options.modelKey;

        this.models.forEach(function (elem) {
            var match = false;
            var searchFields = [
                elem.get('customer').name || ''
            ];

            searchFields.forEach(function (filed) {
                match = match || filed.match(regex);
            });

            elem.set(modelKey, match);
        });
    }
});
