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
            'click .showPreview.no-branches': 'openNoBranch',
            'click .showPreview.branches.before': 'openBeforeInBranch',
            'click .showPreview.branches.after': 'openAfterInBranch',
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

        openNoBranch: _.debounce(function (e) {
            var $el = $(e.target);
            var isBefore = $el.hasClass('before');
            var before = this.model.get('before') || {};
            var after = this.model.get('after') || {};
            var fileCollection;

            if (isBefore) {
                fileCollection = new FileCollection([before.files], true);
            } else {
                fileCollection = new FileCollection([after.files], true);
            }

            var fileModel = fileCollection.at(0);

            this.fileDialogView = new FileDialogPreviewView({
                fileModel  : fileModel,
                translation: this.translation
            });
        }, 1000, true),

        openBeforeInBranch: _.debounce(function (e) {
            var $el = $(e.target);
            var branchId = $el.attr('branch-id');

            var branches = this.model.get('branches');
            var branch = _.find(branches, function(item) {
                return item.branchId === branchId;
            });

            var fileCollection = new FileCollection(branch.before.files, true);
            var fileModel = fileCollection.at(0);

            this.fileDialogView = new FileDialogPreviewView({
                fileModel: fileModel,
                translation: this.translation
            });
        }, 1000, true),

        openAfterInBranch: _.debounce(function (e) {
            var $el = $(e.target);
            var branchId = $el.attr('branch-id');

            var branches = this.model.get('branches');
            var branch = _.find(branches, function(item) {
                return item.branchId === branchId;
            });

            var fileCollection = new FileCollection(branch.after.files, true);
            var fileModel = fileCollection.at(0);

            this.fileDialogView = new FileDialogPreviewView({
                fileModel: fileModel,
                translation: this.translation
            });
        }, 1000, true),

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
                    container = '<video class="showPreview no-branches before" width="400" controls><source src="' + beforeFile.url + '"></video>';
                } else {
                    container = '<img class="imgResponsive showPreview no-branches before" src="' + beforeFile.url + '">';
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
                                    afterFileContainer = '<video branch-id="' + branch.branchId + '" class="showPreview branches after" width="400" controls><source src="' + afterFile.url + '"></video>';
                                } else {
                                    afterFileContainer = '<img  branch-id="' + branch.branchId + '" class="imgResponsive showPreview branches after" src="' + afterFile.url + '">';
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
                            beforeFileContainer = '<video branch-id="' + branchModel._id + '" class="showPreview branches before" width="400" controls><source src="' + beforeFile.url + '"></video>';
                        } else {
                            beforeFileContainer = '<img branch-id="' + branchModel._id + '" class="imgResponsive showPreview branches before" src="' + beforeFile.url + '">';
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
                            afterFileContainer = '<video branch-id="' + branchModel._id + '" class="showPreview branches after" width="400" controls><source src="' + afterFile.url + '"></video>';
                        } else {
                            afterFileContainer = '<img branch-id="' + branchModel._id + '" class="imgResponsive showPreview branches after" src="' + afterFile.url + '">';
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
