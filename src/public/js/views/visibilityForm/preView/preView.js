define([
    'jQuery',
    'Underscore',
    'common',
    'text!templates/visibilityForm/preview.html',
    'models/visibilityForm',
    'views/baseDialog',
    'views/fileDialog/fileDialog',
    'collections/file/collection',
    'constants/errorMessages'
], function ($, _, common, PreviewTemplate, Model, BaseView, FileDialogPreviewView, FileCollection, ERROR_MESSAGES) {

    var manageView = BaseView.extend({
        contentType: 'visibilityForm',

        template: _.template(PreviewTemplate),

        events: {
            'click .showPreview': 'showFilePreviewDialog'
        },

        initialize: function (options) {
            var self = this;
            this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';

            options = options || {};

            this.translation = options.translation;
            this.branchName = options.branchName || '';
            this.description = options.description[this.currentLanguage];

            this.model = new Model({_id: options.id || ''});
            this.model.fetch({
                success: function () {
                    self.makeRender();
                    self.render();
                },
                error  : function () {
                    App.render({type: 'error', message: ERROR_MESSAGES.readError[self.currentLanguage]});
                }
            });
        },

        showFilePreviewDialog: _.debounce(function (e) {
            var $el = $(e.target);
            var haveBefore = $el.hasClass('before');
            var before = this.model.get('before') || {};
            var after = this.model.get('after') || {};
            var fileCollection;
            var fileModel;

            if (haveBefore) {
                fileCollection = new FileCollection([before.files], true);
            } else {
                fileCollection = new FileCollection([after.files], true);
            }

            fileModel = fileCollection.at(0);

            this.fileDialogView = new FileDialogPreviewView({
                fileModel  : fileModel,
                bucket     : 'visibilityForm',
                translation: this.translation
            }); //TODO: change bucket from constants
        }, 1000, true),

        render: function () {
            var self = this;
            var $formString;
            var before = self.model.get('before') || {};

            self.model.set({
                before: {
                    description: this.description,
                    files      : before.files
                }
            });

            var afterPart = this.model.get('after');
            var file = afterPart.files;
            afterPart.files = file;

            this.model.set('after', afterPart);

            $formString = $(self.template({
                model      : self.model.toJSON(),
                branchName : self.branchName,
                translation: self.translation
            }));

            this.$el = $formString.dialog({
                showCancelBtn: false,
                width        : 'auto',
                dialogClass  : 'create-dialog visibilityFormHeight',
                buttons      : {
                    save: {
                        text : self.translation.okBtn,
                        click: function () {
                            self.$el.dialog('close');
                        }
                    }
                }
            });
            this.delegateEvents(this.events);
            return this;
        }
    });
    return manageView;
});
