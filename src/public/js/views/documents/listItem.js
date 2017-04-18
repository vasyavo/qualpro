define(function (require) {

    var Backbone = require('backbone');
    var Marionette = require('marionette');
    var _ = require('underscore');
    var documentPreview = require('views/documents/preview');
    var EditDocumentView = require('views/documents/edit');
    var FileTemplate = require('text!templates/documents/list-item.html');
    var FolderTemplate = require('text!templates/documents/list-item-folder.html');

    return Marionette.View.extend({

        initialize : function (options) {
            this.translation = options.translation;
            this.type = this.model.get('type') || 'file';
        },

        template : function (ops) {
            var template;

            if (ops.type === 'file') {
                template = _.template(FileTemplate)(ops);
            } else {
                template = _.template(FolderTemplate)(ops);
            }

            return template;
        },

        ui : {
            thumbnail : '.documentBody',
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
            if (this.type === 'file') {
                new documentPreview({
                    model : this.model,
                    translation : this.translation
                });
            } else {
                Backbone.history.navigate('qualPro/documents/' + this.model.get('_id'), true);
            }
        },

        showEditView : function () {
            var that = this;

            this.editView = new EditDocumentView({
                model : this.model,
                translation : this.translation
            });

            this.editView.on('file:saved', function (savedData) {
                that.model.set('title', savedData.title);
                that.model.collection.trigger('sync');
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