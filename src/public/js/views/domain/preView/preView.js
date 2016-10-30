define([
    'views/baseDialog',
    'text!templates/domain/preview.html',
    'common',
    'constants/validation',
    'populate'
], function (BaseView, PreviewTemplate, common, REGEXP, populate) {

    var PreView = BaseView.extend({
        template: _.template(PreviewTemplate),
        imageSrc: '',

        events: {
            // "click .showHideAr": "showHideArabicName"
        },

        initialize: function (options) {

            this.model = options.model;
            this.contentType = options.contentType;
            this.viewType = options.viewType;
            this.parentId = options.parentId;
            this.translation = options.translation;

            this.makeRender();
            this.render();
        },

        render: function () {
            var self = this;
            var hasAvatar = this.contentType !== 'branch';
            var jsonModel = this.model.toJSON();
            var formString;

            if (jsonModel.manager && jsonModel.manager.phoneNumber){
                jsonModel.manager.phoneNumber = jsonModel.manager.phoneNumber.replace(REGEXP.DISPLAY_PHONE_REGEXP, '+$1($2)-$3-$4');
            }

            formString = this.template({
                model      : jsonModel,
                contentType: this.contentType,
                translation: this.translation
            });

            this.$el = $(formString).dialog({
                dialogClass  : 'previewDialog',
                title        : 'View Domain',
                showCancelBtn: false,
                buttons      : {
                    save: {
                        text : self.translation.okBtn,
                        click: function () {
                            $(this).dialog('destroy').remove();
                        }
                    }
                }
            });

            if (hasAvatar) {
                common.canvasDraw({
                    model: this.model.toJSON()
                }, this);
            }

            this.delegateEvents(this.events);

            return this;
        }
    });

    return PreView;
});
