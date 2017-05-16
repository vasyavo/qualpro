define(function (require) {

    var $ = require('jquery');
    var moment = require('moment');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Populate = require('populate');
    var DisplayTypeCollection = require('collections/displayType/collection');
    var Template = require('text!../../../templates/promotions/edit-promotion-item.html');

    return Backbone.View.extend({

        initialize: function (options) {
            this.translation = options.translation;
            this.editableBranch = options.branch;

            this.render();
            this.defineUiElements();
        },

        defineUiElements : function () {
            var view = this.$el;
            this.ui = {
                rsp: view.find('#rsp'),
                openingStock: view.find('#opening-stock'),
                sellIn: view.find('#sell-in'),
                closingStock: view.find('#closing-stock'),
                sellOut: view.find('#sell-out'),
                dateStart: view.find('#date-start'),
                dateEnd: view.find('#date-end'),
                comment: view.find('#comment'),
            };
        },

        template: _.template(Template),

        render: function () {
            var that = this;
            var model = this.editableBranch;
            var dateStart = moment(model.dateStart, 'DD.MM.YYYY');
            var dateEnd = moment(model.dateEnd, 'DD.MM.YYYY');

            var layout = this.template({
                translation: this.translation,
                model: model,
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
                                rsp: ui.rsp.val(),
                                opening: [ui.openingStock.val()],
                                sellIn: [ui.sellIn.val()],
                                sellOut: [ui.sellOut.val()],
                                closingStock: [ui.closingStock.val()],
                                dateStart: startDate ? moment(startDate, 'DD.MM.YYYY').toDate() : '',
                                dateEnd: endDate ? moment(endDate, 'DD.MM.YYYY').toDate() : '',
                                displayType: [that.$el.find('#displayTypeDd').attr('data-id')],
                                comment: {
                                    id: ui.comment.attr('data-id'),
                                    text: ui.comment.val(),
                                }
                            };

                            that.trigger('edit-promotion-item', data, model.promotionItemId);
                        }
                    }
                }
            });

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
                    forPosition : true
                });
            }, this);

            var $startDate = this.$el.find('#dateStart');
            var $dueDate = this.$el.find('#dateEnd');

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

            this.delegateEvents(this.events);

            return this;
        }

    });

});
