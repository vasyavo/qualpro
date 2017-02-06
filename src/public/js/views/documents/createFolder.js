define(function (require) {

    var _ = require('underscore');
    var Backbone = require('Backbone');
    var DocumentModel = require('models/documents');
    var Template = require('text!templates/documents/create-folder.html');

    return Backbone.View.extend({

        initialize : function (options) {
            this.translation = options.translation;

            this.render();
            this.bindModelEvents();
        },

        className : 'form-holder personnelInfo promotionEdit documentsEdit largeHeightPreview',

        template : _.template(Template),

        model : new DocumentModel(),

        render : function () {
            var that = this;
            var layout = this.$el.html(that.template({
                translation : this.translation
            }));

            this.$el = $(layout).dialog({
                dialogClass : 'create-dialog',
                title        : that.translation.preViewTitle,
                width        : 'auto',
                height       : 'auto',
                showCancelBtn: false,
                buttons      : {
                    save  : {
                        text : that.translation.saveBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            that.model.saveFolder({
                                title : that.$el.find('#title').val(),
                                type : 'folder'
                            });
                        }
                    },
                    cancel: {
                        text: that.translation.cancelBtn,
                        class: 'btn cancelBtn',
                        click : function () {
                            that.remove();
                        }
                    }
                }
            });
        },

        bindModelEvents : function () {
            var that = this;
            var model = this.model;

            model.on('saved', function (savedData) {
                that.trigger('file:saved', savedData);
                that.remove();
            });
        }

    });

});
