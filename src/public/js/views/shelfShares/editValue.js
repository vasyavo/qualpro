var _ = require('underscore');
var Backbone = require('backbone');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var Template = require('../../../templates/shelfShares/edit-value.html');
var App = require('../../appState');

module.exports = Backbone.View.extend({

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
                        var value = that.ui.valueInput.val();

                        if (value && value > 0 && !isNaN(Number(value))) {
                            that.trigger('new-value-submitted', value);
                            that.$el.dialog('close').dialog('destroy').remove();
                        } else {
                            App.renderErrors([
                                ERROR_MESSAGES.enterCorrectValue[App.currentUser.currentLanguage]
                            ]);
                        }
                    }
                }
            }
        });

        this.delegateEvents(this.events);
    }

});
