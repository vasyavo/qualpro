define(function (require) {

    var Marionette = require('marionette');
    var _ = require('underscore');
    var documentPreview = require('views/documents/preview');
    var EditDocumentView = require('views/documents/edit');
    var Template = require('text!templates/documents/list-item.html');

    return Marionette.View.extend({

        initialize : function (options) {
            this.translation = options.translation;

            var attachment = this.model.get('attachments')[0];
            this.model.set('attachment', attachment);
        },

        template : function (ops) {
            return _.template(Template)(ops);
        },

        ui : {
            thumbnail : '#item',
            checkbox : '#checkbox',
            edit : '#edit'
        },

        events: {
            'mouseup @ui.thumbnail': _.debounce(function(event) {
                if (this.doucleckicked) {
                    this.doucleckicked = false;
                } else {
                    this.onSingleClick.call(this, event);
                }
            }, 300),
            'dblclick @ui.thumbnail': function(event) {
                this.doucleckicked = true;
                this.onDoubleClick.call(this, event);
            },
            'click @ui.edit' : 'showEditView'
        },

        onSingleClick: function() {
            var checkbox = this.ui.checkbox;
            var newCheckedState = !checkbox.prop('checked');

            checkbox.prop('checked', newCheckedState);

            this.trigger('checked', {
                _id : this.model.get('_id'),
                state : newCheckedState
            });
        },

        onDoubleClick : function () {
            new documentPreview({
                model : this.model,
                translation : this.translation
            });
        },

        showEditView : function () {
            new EditDocumentView({
                model : this.model,
                translation : this.translation
            });
        },

        modelEvents : {
            'item:check' : 'checkItem',
            'item:uncheck' : 'uncheckItem'
        },

        checkItem : function () {
            this.ui.checkbox.prop('checked', true);
        },

        uncheckItem : function () {
            this.ui.checkbox.prop('checked', false);
        }

    });

});