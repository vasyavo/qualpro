define(function (require) {

    var moment = require('moment');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var arabicInput = require('helpers/implementShowHideArabicInputIn');
    var Template = require('text!templates/achievementForm/edit.html');

    return Backbone.View.extend({

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
                dialogClass : 'create-dialog',
                buttons : {
                    save : {
                        text : that.translation.saveBtn,
                        click : function () {
                            var ui = that.ui;
                            var startDate = that.$el.find('#dateStart').val();
                            var endDate = that.$el.find('#dateEnd').val();
                            var data = {
                                dateStart: startDate ? moment(startDate, 'DD.MM.YYYY').toDate() : '',
                                dateEnd: endDate ? moment(endDate, 'DD.MM.YYYY').toDate() : '',
                                description: {
                                    en: ui.descriptionEn.val(),
                                    ar: ui.descriptionAr.val(),
                                },
                                additionalComment: {
                                    en: ui.additionalCommentEn.val(),
                                    ar: ui.additionalCommentAr.val(),
                                },
                            };

                            that.trigger('edit-achievement-form-item', data, model._id);
                        }
                    }
                }
            });

            var $startDate = this.$el.find('#dateStart');
            var $dueDate = this.$el.find('#dateEnd');

            $startDate.datepicker({
                changeMonth: true,
                changeYear : true,
                maxDate : new Date(dateEnd),
                yearRange  : '-20y:c+10y',
                defaultDate: new Date(dateStart),
                onClose    : function (selectedDate) {
                    $dueDate.datepicker('option', 'minDate', selectedDate);
                }
            });
            $dueDate.datepicker({
                changeMonth: true,
                changeYear : true,
                minDate : new Date(dateStart),
                yearRange  : '-20y:c+10y',
                defaultDate: new Date(dateEnd),
                onClose    : function (selectedDate) {
                    $startDate.datepicker('option', 'maxDate', selectedDate);
                }
            });

            arabicInput(this);

            this.$el.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });
        }

    });

});
