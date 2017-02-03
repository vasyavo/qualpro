define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('Backbone');
    var Template = require('text!templates/documents/edit.html');

    return Backbone.View.extend({

        initialize : function (options) {
            this.translation = options.translation;

            this.model.set('translation', this.translation);

            this.render();
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
                            alert('currently not implemented!');
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
        }

    });

});