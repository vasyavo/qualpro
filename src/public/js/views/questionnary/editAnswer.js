var _ = require('underscore');
var Backbone = require('backbone');
var arabicInput = require('../../helpers/implementShowHideArabicInputIn');
var AVAILABLE_CONSUMER_SURVEY_TYPES = require('../../constants/otherConstants').AVAILABLE_CONSUMER_SURVEY_TYPES;
var ERROR_MESSAGES = require('../../constants/errorMessages');
var WrapperTemplate = require('../../../templates/questionnary/editAnswer/wrapper.html');
var FullAnswerTemplate = require('../../../templates/questionnary/editAnswer/full-answer.html');
var MultiSelectAnswerTemplate = require('../../../templates/questionnary/editAnswer/multi-select-answer.html');
var SingleSelectAnswerTemplate = require('../../../templates/questionnary/editAnswer/single-select-answer.html');
var NpsAnswerTemplate = require('../../../templates/questionnary/editAnswer/nps-answer.html');

module.exports = Backbone.View.extend({

    initialize: function (options) {
        this.translation = options.translation;
        this.questionType = options.questionType;
        this.questionOptions = options.questionOptions;
        this.questionText = options.questionText;
        this.selectedOptionIndexes = options.selectedOptionIndexes ? options.selectedOptionIndexes.map(function (item) {
            return --item;
        }) : null;
        this.fullAnswer = options.fullAnswer;

        if (this.selectedOptionIndexes) {
            this.selectedOptions = this.selectedOptionIndexes;
        }

        this.render();
        this.defineUiElements();
    },

    defineUiElements : function () {
        var view = this.$el;
        this.ui = {
            descriptionEn: view.find('#description-en'),
            descriptionAr: view.find('#description-ar'),
        };
    },

    events: {
        'click .answer-checkbox': 'handleMultiSelectOptionClick',
        'change input[type="radio"]': 'handleSingleSelectOptionClick',
    },

    template: _.template(WrapperTemplate),

    fullAnswerTemplate: _.template(FullAnswerTemplate),

    multiSelectAnswerTemplate: _.template(MultiSelectAnswerTemplate),

    singleSelectAnswerTemplate: _.template(SingleSelectAnswerTemplate),

    npsAnswerTemplate: _.template(NpsAnswerTemplate),

    selectedOptions: [],

    handleSingleSelectOptionClick : function (event) {
        var value = event.target.value;

        this.selectedOptions = [value];
    },

    handleMultiSelectOptionClick: function (event) {
        var target = event.target;
        var checked = target.checked;
        var option = target.value;
        var selectedOptions = this.selectedOptions;

        if (checked) {
            selectedOptions.push(option);
        } else {
            var index = selectedOptions.findIndex(function (item) {
                return parseInt(item) === parseInt(option);
            });

            selectedOptions.splice(index, 1);
        }

        this.selectedOptions = selectedOptions;
    },

    render: function () {
        var that = this;
        var currentLanguage = App.currentUser.currentLanguage;
        var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

        var layout = $(this.template({
            translation: this.translation,
            question: this.questionText,
        }));

        this.$el = layout.dialog({
            width : 'auto',
            dialogClass : 'self-share-dialog',
            buttons : {
                save : {
                    text : that.translation.saveBtn,
                    click : function () {
                        var data = {};
                        var valid = false;

                        if (that.questionType === AVAILABLE_CONSUMER_SURVEY_TYPES.fullAnswer) {
                            var descriptionObj = {
                                en: that.ui.descriptionEn.val(),
                                ar: that.ui.descriptionAr.val(),
                            };

                            if (descriptionObj.ar || descriptionObj.en) {
                                data.text = descriptionObj;
                                valid = true;
                            } else {
                                App.renderErrors([
                                    ERROR_MESSAGES.answerRequired[currentLanguage]
                                ]);
                            }
                        } else {
                            if (that.selectedOptions.length) {
                                data.optionIndex = that.selectedOptions;
                                valid = true;
                            } else {
                                App.renderErrors([
                                    ERROR_MESSAGES.answerRequired[currentLanguage]
                                ]);
                            }
                        }

                        if (valid) {
                            that.trigger('edit-answer', data);
                        }
                    }
                }
            }
        });

        if (this.questionType === AVAILABLE_CONSUMER_SURVEY_TYPES.fullAnswer) {
            this.$el.find('#answer-container').html(this.fullAnswerTemplate({
                answer: that.fullAnswer,
                translation: this.translation,
                currentLanguage: currentLanguage,
                anotherLanguage: anotherLanguage,
            }));
        }

        if (this.questionType === AVAILABLE_CONSUMER_SURVEY_TYPES.multiChoice) {
            this.$el.find('#answer-container').html(this.multiSelectAnswerTemplate({
                questionOptions: this.questionOptions,
            }));

            this.selectedOptionIndexes.forEach(function (item) {
                that.$el.find('#answer-option-' + item).prop('checked', true);
            });
        }

        if (this.questionType === AVAILABLE_CONSUMER_SURVEY_TYPES.singleChoice) {
            this.$el.find('#answer-container').html(this.singleSelectAnswerTemplate({
                questionOptions: this.questionOptions,
            }));

            this.selectedOptionIndexes.forEach(function (item) {
                that.$el.find('#answer-option-' + item).prop('checked', true);
            });
        }

        if (this.questionType === AVAILABLE_CONSUMER_SURVEY_TYPES.nps) {
            this.$el.find('#answer-container').html(this.npsAnswerTemplate({
                questionOptions: this.questionOptions,
            }));

            this.selectedOptionIndexes.forEach(function (item) {
                that.$el.find('#answer-option-' + item).prop('checked', true);
            });
        }

        arabicInput(this);

        this.$el.find('.objectivesTextarea').each(function (index, element) {
            var $element = $(element);

            $element.ckeditor({language: $element.attr('data-property')});
        });

        this.delegateEvents(this.events);
    }

});
