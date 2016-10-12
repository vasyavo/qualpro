define([
    'Backbone',
    'Underscore',
    'jQuery',
    'constants/contentType',
    'views/baseDialog',
    'text!templates/notifications/preview.html'
],
function (Backbone, _, $, CONTENT_TYPES, BaseView, PreviewTemplate) {
    'use strict';

    var PreView = BaseView.extend({
        contentType: CONTENT_TYPES.NOTIFICATIONS,

        template: _.template(PreviewTemplate),

        initialize: function (options) {

            this.translation = options.translation;
            this.model = options.model;
            this.language = App.currentUser.currentLanguage;

            this.makeRender();
            this.render();
        },

        render: function () {
            var jsonModel = this.model.toJSON();
            var formString;
            var self = this;
            jsonModel.currentLanguage = this.language;

            formString = this.$el.html(this.template({
                jsonModel: jsonModel,
                translation: this.translation
            }));

            this.$el = formString.dialog({
                dialogClass  : 'create-dialog competitorBranding-dialog',
                title        : this.translation.viewNotification,
                width        : '1000',
                showCancelBtn: false,
                buttons      : {
                    save: {
                        text : this.translation.okBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            self.undelegateEvents();
                            self.$el.dialog('close').dialog('destroy').remove();
                        }
                    }
                },
                close: function () {
                    var model = self.model;
                    var id;
                    var previousAttributes;

                    if (model.changedAttributes()) {
                        id = model.get('_id');
                        previousAttributes = model.previousAttributes();
                        model.clear();
                        model.set(previousAttributes);
                        model.set({_id: id});
                    }

                    $('body').css({overflow: 'inherit'});
                }
            });
        }
    });

    return PreView;
});
