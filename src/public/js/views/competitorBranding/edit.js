define(function (require) {

    var moment = require('moment');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Populate = require('populate');
    var arabicInput = require('helpers/implementShowHideArabicInputIn');
    var DisplayTypeCollection = require('collections/displayType/collection');
    var Template = require('text!templates/competitorBranding/edit.html');

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
            };
        },

        template: _.template(Template),

        render: function () {
            var that = this;
            var model = this.editableModel;
            var dateStart = moment(model.dateStart, 'DD.MM.YYYY');
            var dateEnd = moment(model.dateEnd, 'DD.MM.YYYY');
            var currentLanguage = App.currentUser.currentLanguage || 'en';
            var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

            var layout = $(this.template({
                translation: this.translation,
                model: model,
                currentLanguage: currentLanguage,
                anotherLanguage: anotherLanguage,
            }));

            this.$el = layout.dialog({
                width : 'auto',
                dialogClass : 'create-dialog',
                buttons : {
                    save : {
                        text : that.translation.saveBtn,
                        click : function () {
                            var ui = that.ui;
                            var data = {
                                dateStart: moment(ui.dateStart.val()).toDate(),
                                dateEnd: moment(ui.dateEnd.val()).toDate(),
                                displayType: that.$el.find('#displayTypeDd').attr('data-id').split(','),
                                description: {
                                    en: ui.descriptionEn.val(),
                                    ar: ui.descriptionAr.val(),
                                },
                            };

                            that.trigger('edit-competitor-branding-item', data, model._id);
                        }
                    }
                }
            });

            var $startDate = that.$el.find('#date-start');
            var $dueDate = that.$el.find('#date-end');

            var startDateObj = {
                changeMonth: true,
                changeYear : true,
                maxDate : new Date(dateEnd),
                yearRange  : '-20y:c+10y',
                defaultDate: new Date(dateStart),
                onClose    : function (selectedDate) {
                    $dueDate.datepicker('option', 'minDate', selectedDate);
                }
            };

            var endDateObj = {
                changeMonth: true,
                changeYear : true,
                minDate : new Date(dateStart),
                yearRange  : '-20y:c+10y',
                defaultDate: new Date(dateEnd),
                onClose    : function (selectedDate) {
                    $startDate.datepicker('option', 'maxDate', selectedDate);
                }
            };

            $startDate.datepicker(startDateObj);
            $dueDate.datepicker(endDateObj);

            this.displayTypeCollection = new DisplayTypeCollection();
            this.displayTypeCollection.on('reset', function () {
                const defaultDisplayTypes = model.displayType.map(function (item) {
                    return that.displayTypeCollection.findWhere({_id : item._id}).toJSON();
                });

                Populate.inputDropDown({
                    selector    : '#displayTypeDd',
                    context     : that,
                    contentType : 'displayType',
                    displayText : 'display type',
                    displayModel: defaultDisplayTypes,
                    collection  : that.displayTypeCollection.toJSON(),
                    multiSelect: true,
                    forPosition : true
                });
            }, this);

            arabicInput(this);

            this.$el.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });
        }

    });

});
