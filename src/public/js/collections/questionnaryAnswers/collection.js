var _ = require('underscore');
var Parent = require('../parrent');
var Model = require('../../models/questionnaryAnswer');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = Parent.extend({
    model      : Model,
    url        : '/questionnary/answer',
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

        collection.forEach(function (item) {
            var valid = true;

            answers.forEach(function (answer) {
                if (_.isEqual(answer.branch, item.branch) && answer.personnelId === item.personnelId) {
                    valid = false;
                }
            });

            if (valid && item.selectedForPersonnel) {
                answers.push(item);
            }
        });

        return answers;
    },

    getSelected: function (options) {
        var self = this;

        return _.filter(this.toJSON(), function (model) {

            if ((model.questionId === self.questionId && options.modelKey === 'selected') || (model.personnel._id === self.personnelId && options.modelKey === 'selectedForPersonnel')) {
                return model[options.modelKey];
            }

            return false;
        });
    },

    search: function (options) {
        var text = options.text || '';
        var regex = new RegExp(text, 'i');
        var modelKey = options.modelKey;
        var domainsContentTypes = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH];

        this.models.forEach(function (elem) {
            var match = false;
            var searchFields = [
                elem.get('personnel').firstName.en || '',
                elem.get('personnel').firstName.ar || '',
                elem.get('personnel').lastName.en || '',
                elem.get('personnel').lastName.ar || '',
                elem.get('position').name.en || '',
                elem.get('position').name.ar || ''
            ];

            domainsContentTypes.forEach(function (contentType) {
                var domains = elem.get(contentType);

                domains.forEach(function (domain) {
                    if (domain.name && domain.name.en) {
                        searchFields.push(domain.name.en);
                    }

                    if (domain.name && domain.name.ar) {
                        searchFields.push(domain.name.ar);
                    }
                });
            });

            searchFields.forEach(function (filed) {
                match = match || filed.match(regex);
            });

            elem.set(modelKey, match);
        });
    }
});
