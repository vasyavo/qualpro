define([
    'jQuery',
    'Underscore',
    'common',
    'text!templates/objectives/visibilityForm/preview.html',
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
            this.branches = options.branches || [];
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

        showFilePreviewDialog: function (e) {
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
        },

        render: function () {
            var self = this;
            var $formString;
            var before = self.model.get('before');
            var branches = self.model.get('branches');

            self.model.set({
                before: {
                    description: this.description
                }
            });

            if (before.files.length) {
                var container;
                var file = before.files[0];
                var fileType = file.contentType.substr(0, 5);

                if (fileType === 'video') {
                    container = '<video class="showPreview before" width="400" controls><source src="' + file.url + '"></video>';
                } else {
                    container = '<img class="imgResponsive showPreview before" src="' + file.url + '">';
                }

                self.branches.map(function (item) {
                    item.fileContainer = container;
                    item.fileName = file.originalName;
                    return item;
                });
            } else if (branches.length) {
                branches.map(function (item) {
                    var branchModel = _.find(self.branches, function (branch) {
                        return branch._id === item.branchId;
                    });

                    var file = item.before.files[0];
                    var fileType = file.contentType.substr(0, 5);

                    if (fileType === 'video') {
                        container = '<video class="showPreview before" width="400" controls><source src="' + file.url + '"></video>';
                    } else {
                        container = '<img class="imgResponsive showPreview before" src="' + file.url + '">';
                    }

                    branchModel.fileContainer = container;
                    branchModel.fileName = file.originalName;

                    return item;
                });
            }

            $formString = $(self.template({
                model : self.model.toJSON(),
                branches : self.branches,
                translation : self.translation
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
