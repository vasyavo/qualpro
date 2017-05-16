define(function (require) {

    var _ = require('underscore');
    var Backbone = require('backbone');
    var Template = require('text!templates/marketingCampaign/marketingCampaignItem/edit-comment.html');

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
                commentBody : view.find('#new-comment-body'),
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
                            var value = that.ui.commentBody.val().trim();

                            that.trigger('edit-comment', value);
                        }
                    }
                }
            });

            this.delegateEvents(this.events);
        }

    });

});