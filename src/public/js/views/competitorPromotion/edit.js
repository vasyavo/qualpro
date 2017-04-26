define(function (require) {

    var moment = require('moment');
    var Backbone = require('backbone');
    var Populate = require('populate');
    var DisplayTypeCollection = require('collections/displayType/collection');
    var Template = require('text!templates/competitorPromotion/edit.html');

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
                price: view.find('#price'),
                weight: view.find('#weight'),
                expiry: view.find('#date-expiry'),
                closingStock: view.find('#closing-stock'),
                dateStart: view.find('#date-start'),
                dateEnd: view.find('#date-end'),
                description: view.find('#description'),
            };
        },

        template: _.template(Template),

        render: function () {
            var that = this;
            var model = this.editableModel;
            var dateStart = moment(model.dateStart, 'DD.MM.YYYY');
            var dateEnd = moment(model.dateEnd, 'DD.MM.YYYY');

            var layout = $(this.template({
                translation: this.translation,
                model: model,
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
                                price: ui.price.val(),
                                packing: ui.weight.val(),
                                expiry: moment(ui.expiry.val()).toDate(),
                                dateStart: moment(ui.dateStart.val()).toDate(),
                                dateEnd: moment(ui.dateEnd.val()).toDate(),
                                displayType: that.$el.find('#displayTypeDd').attr('data-id').split(','),
                                promotion: ui.description.val(),
                            };

                            that.trigger('edit-competitor-promotion-item', data, model._id);
                        }
                    }
                }
            });

            var $startDate = that.$el.find('#date-start');
            var $dueDate = that.$el.find('#date-end');
            var $expiryDate = that.$el.find('#date-expiry');

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

            var expiryDateObj = {
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                defaultDate: new Date(dateEnd),
            };

            $startDate.datepicker(startDateObj);
            $dueDate.datepicker(endDateObj);
            $expiryDate.datepicker(expiryDateObj);

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
        }

    });

});
