var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Template = require('../../../templates/documents/edit.html');

module.exports = Backbone.View.extend({

    initialize : function (options) {
        this.translation = options.translation;

        this.model.set('translation', this.translation);

        this.render();
        this.bindModelEvents();
    },

    className : 'form-holder personnelInfo promotionEdit documentsEdit largeHeightPreview',

    template : _.template(Template),

    render : function () {
        var that = this;
        var layout = this.$el.html(that.template(that.model.toJSON()));

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
                        var modelId = that.model.get('_id');
                        var data = {
                            title : that.$el.find('#title').val()
                        };

                        that.model.updateTitle(modelId, data);
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
