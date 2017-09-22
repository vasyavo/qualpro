var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var DocumentModel = require('../../models/documents');
var Template = require('../../../templates/documents/create-folder.html');

module.exports = Backbone.View.extend({

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
                        var data = {
                            title : that.$el.find('#title').val(),
                            type : 'folder'
                        };
                        var folder = that.collection.folder;
                        if (folder) {
                            data.parent = folder;
                        }

                        that.model.saveFolder(data);
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
