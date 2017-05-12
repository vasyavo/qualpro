define(function (require) {

    var _ = require('underscore');
    var Backbone = require('backbone');
    var arabicInput = require('helpers/implementShowHideArabicInputIn');
    var AVAILABLE_CONSUMER_SURVEY_TYPES = require('constants/otherConstants').AVAILABLE_CONSUMER_SURVEY_TYPES;
    var WrapperTemplate = require('text!templates/questionnary/editAnswer/wrapper.html');
    var FullAnswerTemplate = require('text!templates/questionnary/editAnswer/full-answer.html');
    var MultiSelectAnswerTemplate = require('text!templates/questionnary/editAnswer/multi-select-answer.html');
    var SingleSelectAnswerTemplate = require('text!templates/questionnary/editAnswer/single-select-answer.html');

    return Backbone.View.extend({

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
                    return item === option;
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
                                data.text = {
                                    en: that.ui.descriptionEn.val(),
                                    ar: that.ui.descriptionAr.val(),
                                };
                                valid = true;
                            } else {
                                if (that.selectedOptions.length) {
                                    data.optionIndex = that.selectedOptions;
                                    valid = true;
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

            if ([AVAILABLE_CONSUMER_SURVEY_TYPES.singleChoice, AVAILABLE_CONSUMER_SURVEY_TYPES.nps].includes(this.questionType)) {
                this.$el.find('#answer-container').html(this.singleSelectAnswerTemplate({
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

});
