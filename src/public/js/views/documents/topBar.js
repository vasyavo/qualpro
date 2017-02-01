define(function (require) {

    var Marionette = require('marionette');
    var _ = require('underscore');
    var Template = require('text!templates/documents/topBar.html');

    return Marionette.View.extend({

        initialize : function (options) {
            this.translation = options.translation;
        },

        template : function (ops) {
            return _.template(Template)(ops);
        },

        templateContext: function () {
            return {
                translation: this.translation
            };
        },

        ui : {
            actionHolder : '#actionHolder',
            checkAll : '#check-all',
            actionsDropdown : '#actions-dropdown'
        },

        events : {
            'click @ui.checkAll' : 'checkAllItems',
            'click @ui.actionHolder' : 'openActions'
        },

        checkAllItems : function (event) {
            var checked = event.target.checked;

            this.changeActionHolderState(checked);

            this.collection.checked = this.collection.models.map(function (model) {
                if (checked) {
                    model.trigger('item:check');
                    return model.get('_id');
                } else {
                    model.trigger('item:uncheck');
                    return null;
                }
            }).filter(function (item) {
                return item;
            });
        },

        openActions : function () {
            this.ui.actionsDropdown.toggleClass('showActionsDropDown');
        },

        collectionEvents : {
            'item:checked' : 'itemChecked'
        },

        itemChecked : function () {
            var arrayOfCheckedValues = this.collection.checked;
            var valuesCount = arrayOfCheckedValues.length;

            this.changeActionHolderState(valuesCount);

            if (valuesCount === this.collection.length) {
                this.ui.checkAll.prop('checked', true);
            } else {
                this.ui.checkAll.prop('checked', false);
            }
        },

        changeActionHolderState : function (condition) {
            if (condition) {
                this.ui.actionHolder.removeClass('hidden');
            } else {
                this.ui.actionHolder.addClass('hidden');
            }
        }

    });

});
