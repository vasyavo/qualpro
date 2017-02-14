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
                var beforeFile = before.files[0];
                var fileType = beforeFile.contentType.substr(0, 5);

                if (fileType === 'video') {
                    container = '<video class="showPreview before" width="400" controls><source src="' + beforeFile.url + '"></video>';
                } else {
                    container = '<img class="imgResponsive showPreview before" src="' + beforeFile.url + '">';
                }

                self.branches.map(function (item) {
                    item.beforeFileContainer = container;
                    item.beforeFileName = beforeFile.originalName;

                    item.afterFileContainer = '';
                    item.afterFileName = 'No File';
                    item.afterDescription = '';

                    if (branches.length) {
                        var branch = _.find(branches, function (element) {
                            return element.branchId === item._id;
                        });

                        if (branch) {
                            var afterFile = branch.after.files[0];
                            if (afterFile) {
                                var afterFileContainer;
                                var afterFileType = afterFile.contentType.substr(0, 5);

                                if (afterFileType === 'video') {
                                    afterFileContainer = '<video class="showPreview before" width="400" controls><source src="' + afterFile.url + '"></video>';
                                } else {
                                    afterFileContainer = '<img class="imgResponsive showPreview before" src="' + afterFile.url + '">';
                                }

                                item.afterFileContainer = afterFileContainer;
                                item.afterFileName = afterFile.originalName;
                                item.afterDescription = branch.after.description;
                            }
                        }
                    }

                    return item;
                });
            } else if (branches.length) {
                branches.map(function (item) {
                    var beforeFileContainer;
                    var afterFileContainer;
                    var branchModel = _.find(self.branches, function (branch) {
                        return branch._id === item.branchId;
                    });

                    branchModel.beforeFileContainer = '';
                    branchModel.beforeFileName = '';

                    var beforeFile = item.before.files[0];
                    if (beforeFile) {
                        var beforeFileType = beforeFile.contentType.substr(0, 5);

                        if (beforeFileType === 'video') {
                            beforeFileContainer = '<video class="showPreview before" width="400" controls><source src="' + beforeFile.url + '"></video>';
                        } else {
                            beforeFileContainer = '<img class="imgResponsive showPreview before" src="' + beforeFile.url + '">';
                        }

                        branchModel.beforeFileContainer = beforeFileContainer;
                        branchModel.beforeFileName = beforeFile.originalName;
                    }

                    branchModel.afterFileContainer = '';
                    branchModel.afterFileName = 'No File';
                    branchModel.afterDescription = item.after.description;

                    var afterFile = item.after.files[0];
                    if (afterFile) {
                        var afterFileType = afterFile.contentType.substr(0, 5);

                        if (afterFileType === 'video') {
                            afterFileContainer = '<video class="showPreview before" width="400" controls><source src="' + afterFile.url + '"></video>';
                        } else {
                            afterFileContainer = '<img class="imgResponsive showPreview before" src="' + afterFile.url + '">';
                        }

                        branchModel.afterFileContainer = afterFileContainer;
                        branchModel.afterFileName = afterFile.originalName;
                    }

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
