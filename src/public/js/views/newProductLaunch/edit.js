define(function (require) {

    var moment = require('moment');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Populate = require('populate');
    var arabicInput = require('helpers/implementShowHideArabicInputIn');
    var DisplayTypeCollection = require('collections/displayType/collection');
    var OriginCollection = require('collections/origin/collection');
    var ERROR_MESSAGE = require('constants/errorMessages');
    var Template = require('text!templates/newProductLaunch/edit.html');

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
                packing: view.find('#packing'),
                price: view.find('#price'),
                distributorEn: view.find('#distributor-en'),
                distributorAr: view.find('#distributor-ar'),
                additionalCommentEn: view.find('#description-en'),
                additionalCommentAr: view.find('#description-ar'),
            };
        },

        template: _.template(Template),

        render: function () {
            var that = this;
            var model = this.editableModel;
            var dateStart = moment(model.shelfLifeStart, 'DD.MM.YYYY');
            var dateEnd = moment(model.shelfLifeEnd, 'DD.MM.YYYY');
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
                            var valid = true;
                            var startDate = that.$el.find('#dateStart').val();
                            var endDate = that.$el.find('#dateEnd').val();
                            var data = {
                                shelfLifeStart: startDate ? moment.utc(startDate, 'DD.MM.YYYY').startOf('day').toDate() : '',
                                shelfLifeEnd: endDate ? moment.utc(endDate, 'DD.MM.YYYY').endOf('day').toDate() : '',
                                packing: ui.packing.val(),
                                price: ui.price.val(),
                                displayType: that.$el.find('#displayTypeDd').attr('data-id').split(','),
                                origin: that.$el.find('#originDd').attr('data-id'),
                                additionalComment: {
                                    en: ui.additionalCommentEn.val(),
                                    ar: ui.additionalCommentAr.val(),
                                },
                                distributor: {
                                    en: ui.distributorEn.val(),
                                    ar: ui.distributorAr.val(),
                                },
                            };

                            if (data.displayType) {
                                data.displayType = data.displayType.filter(function (item) {
                                    return item;
                                });
                            }

                            if (!data.packing) {
                                App.renderErrors([
                                    ERROR_MESSAGE.weightRequired[currentLanguage]
                                ]);
                                valid = false;
                            }

                            if (!data.price) {
                                App.renderErrors([
                                    ERROR_MESSAGE.priceRequired[currentLanguage]
                                ]);
                                valid = false;
                            }

                            if (!data.displayType.length) {
                                App.renderErrors([
                                    ERROR_MESSAGE.displayTypeRequired[currentLanguage]
                                ]);
                                valid = false;
                            }

                            if (!data.distributor.en && !data.distributor.ar) {
                                App.renderErrors([
                                    ERROR_MESSAGE.distributorRequired[currentLanguage]
                                ]);
                                valid = false;
                            }

                            if (!data.additionalComment.en && !data.additionalComment.ar) {
                                App.renderErrors([
                                    ERROR_MESSAGE.additionalCommentRequired[currentLanguage]
                                ]);
                                valid = false;
                            }

                            if (valid) {
                                that.trigger('edit-new-product-lunch', data, model._id);
                            }
                        }
                    }
                }
            });

            var $startDate = that.$el.find('#dateStart');
            var $dueDate = that.$el.find('#dateEnd');

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

            this.originCollection = new OriginCollection();
            this.originCollection.on('reset', function () {
                const defaultOrigin = [model.origin].map(function (item) {
                    return that.originCollection.findWhere({_id : item._id}).toJSON();
                });

                Populate.inputDropDown({
                    selector    : '#originDd',
                    context     : that,
                    contentType : 'origin',
                    displayText : 'Origin',
                    displayModel: defaultOrigin,
                    collection  : that.originCollection.toJSON(),
                    forPosition : true,
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
