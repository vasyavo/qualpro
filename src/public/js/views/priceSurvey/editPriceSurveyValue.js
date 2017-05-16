define(function (require) {

    var _ = require('underscore');
    var Backbone = require('backbone');
    var Template = require('text!templates/priceSurvey/edit-price-survey-value.html');

    return Backbone.View.extend({

        initialize: function (options) {
            this.translation = options.translation;
            this.initialValue = options.initialValue;

            this.render();
            this.defineUiElements();
        },

        defineUiElements : function () {
            var view = this.$el;
            this.ui = {
                valueInput : view.find('#value'),
            };
        },

        template: _.template(Template),

        render: function () {
            var that = this;

            var layout = $(this.template({
                translation: this.translation,
                initialValue: this.initialValue,
            }));

            this.$el = layout.dialog({
                width : 'auto',
                dialogClass : 'self-share-dialog',
                buttons : {
                    save : {
                        text : that.translation.saveBtn,
                        click : function () {
                            var newPrice = that.ui.valueInput.val();

                            that.trigger('new-price-submitted', newPrice);
                            that.$el.dialog('close').dialog('destroy').remove();
                        }
                    }
                }
            });

            this.delegateEvents(this.events);
        }

    });

});