define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Template = require('text!templates/planogram/manage-products-information.html');

    return Backbone.View.extend({

        initialize: function (options) {
            this.translation = options.translation;

            this.render();
        },

        template: _.template(Template),

        event: {

        },

        render: function () {
            var that = this;

            var layout = this.template({
                translation: this.translation,
            });

            this.$el = $(layout).dialog({
                width : 'auto',
                dialogClass : 'self-share-dialog',
                showCancelBtn: false,
                buttons : {
                    save : {
                        text : that.translation.close,
                        click : function () {
                            // todo

                            that.$el.dialog('close').dialog('destroy').remove();
                        }
                    }
                }
            });

            this.delegateEvents(this.events);
        }

    });

});
