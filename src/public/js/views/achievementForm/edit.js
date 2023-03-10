var $ = require('jquery');
var moment = require('moment');
var _ = require('underscore');
var Backbone = require('backbone');
var arabicInput = require('../../helpers/implementShowHideArabicInputIn');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var Template = require('../../../templates/achievementForm/edit.html');
var App = require('../../appState');

module.exports = Backbone.View.extend({

    initialize: function (options) {
        this.translation = options.translation;
        this.editableModel = options.editableModel;

        this.render();
        this.defineUiElements();
    },

    defineUiElements : function () {
        var view = this.$el;
        this.ui = {
            dateStart: view.find('#date-start'),
            dateEnd: view.find('#date-end'),
            descriptionEn: view.find('#description-en'),
            descriptionAr: view.find('#description-ar'),
            additionalCommentEn: view.find('#additional-comment-en'),
            additionalCommentAr: view.find('#additional-comment-ar'),
        };
    },

    template: _.template(Template),

    render: function () {
        var that = this;
        var model = this.editableModel;
        var dateStart = moment(model.startDate, 'DD.MM.YYYY');
        var dateEnd = moment(model.endDate, 'DD.MM.YYYY');
        var currentLanguage = App.currentUser.currentLanguage || 'en';
        var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

        var layout = this.template({
            translation: this.translation,
            model: model,
            currentLanguage: currentLanguage,
            anotherLanguage: anotherLanguage,
        });

        this.$el = $(layout).dialog({
            width : 'auto',
            dialogClass : 'create-dialog achievement-form-edit',
            buttons : {
                save : {
                    text : that.translation.saveBtn,
                    click : function () {
                        var ui = that.ui;
                        var valid = true;
                        var startDate = that.$el.find('#dateStart').val();
                        var endDate = that.$el.find('#dateEnd').val();
                        var data = {
                            startDate: startDate ? moment.utc(startDate, 'DD.MM.YYYY').startOf('day').toDate() : '',
                            endDate: endDate ? moment.utc(endDate, 'DD.MM.YYYY').endOf('day').toDate() : '',
                            description: {
                                en: ui.descriptionEn.val(),
                                ar: ui.descriptionAr.val(),
                            },
                            additionalComment: {
                                en: ui.additionalCommentEn.val(),
                                ar: ui.additionalCommentAr.val(),
                            },
                        };

                        if (!data.description.en && !data.description.ar) {
                            App.renderErrors([
                                ERROR_MESSAGES.enterDescription[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (!data.additionalComment.en && !data.additionalComment.ar) {
                            App.renderErrors([
                                ERROR_MESSAGES.additionalCommentRequired[currentLanguage]
                            ]);
                            valid = false;
                        }

                        if (valid) {
                            that.trigger('edit-achievement-form-item', data, model._id);
                        }
                    }
                }
            }
        });

        var startDateElement = this.$el.find('#dateStart');
        var dueDateElement = this.$el.find('#dateEnd');

        $(startDateElement).datepicker({
            changeMonth: true,
            changeYear : true,
            maxDate : new Date(dateEnd),
            yearRange  : '-20y:c+10y',
            defaultDate: new Date(dateStart),
            onClose    : function (selectedDate) {
                dueDateElement.datepicker('option', 'minDate', selectedDate);
            }
        });
        $(dueDateElement).datepicker({
            changeMonth: true,
            changeYear : true,
            minDate : new Date(dateStart),
            yearRange  : '-20y:c+10y',
            defaultDate: new Date(dateEnd),
            onClose    : function (selectedDate) {
                startDateElement.datepicker('option', 'maxDate', selectedDate);
            }
        });
        startDateElement.on('click', function () {
            $(this).datepicker('show');
        });

        arabicInput(this);

        this.$el.find('.objectivesTextarea').each(function (index, element) {
            var $element = $(element);

            $element.ckeditor({language: $element.attr('data-property')});
        });
    }

});
