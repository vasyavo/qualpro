define([
    'jQuery',
    'Underscore',
    'common',
    'async',
    'text!templates/objectives/visibilityForm/edit.html',
    'text!templates/visibilityForm/editAfter.html',
    'models/visibilityForm',
    'views/baseDialog',
    'constants/otherConstants',
    'constants/errorMessages'
], function ($, _, common, async, EditTemplate, EditAfterTemplate, Model, BaseView, CONSTANTS, ERROR_MESSAGES) {

    var manageView = BaseView.extend({
        contentType: 'visibilityForm',

        template     : _.template(EditTemplate),
        templateAfter: _.template(EditAfterTemplate),

        errors: {},

        events: {
            'change #inputAfter' : 'imageTest',
            'change #apply-to-all' : 'applyFileToAllBranches'
        },

        initialize: function (options) {
            var self = this;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

            options = options || {};

            self.forEdit = options.forEdit;
            this.forCreate = options.forCreate;
            this.translation = options.translation;
            this.description = $(options.description[currentLanguage]).text();
            this.outlets = options.outlets || [];
            this.editAfter = options.editAfter;
            this.oldAjaxObj = options.oldAjaxObj;
            this.filesIdToDeleted = [];

            if (this.forCreate) {
                if (options.savedVisibilityModel) {
                    this.model = options.savedVisibilityModel;
                } else {
                    this.model = new Model();
                }

                self.makeRender();
                self.render();
            } else {
                if (options.savedVisibilityModel) {
                    this.model = options.savedVisibilityModel;
                    self.makeRender();
                    self.render();
                } else {
                    this.model = new Model({_id: options.id});

                    this.model.fetch({
                        success: function () {
                            self.makeRender();
                            self.combineFiles();
                            self.render();
                        },
                        error  : function () {
                            App.render({type: 'error', message: ERROR_MESSAGES.readError[currentLanguage]});
                        }
                    });
                }
            }

            if (!this.model.get('tempRealFiles')) {
                this.model.set('tempRealFiles', {});
            }

            if (!this.model.get('realFiles')) {
                this.model.set('realFiles', {});
            }

            this.model.set('originalApplyStatus', this.model.get('applyFileToAll'));
        },

        combineFiles : function () {
            var branches = this.model.get('branches');

            var files = branches.map(function (branch) {
                var result = {
                    branch : branch.branchId
                };
                var fileData = branch.before.files[0];

                if (fileData) {
                    result.fileName = fileData.originalName;
                    result.contentType = fileData.contentType.substring(0, 5);
                    result.url  = fileData.url;
                    result._id = fileData._id;
                } else {
                    result.fileName = '';
                    result.contentType = '';
                    result.url  = '';
                }

                return result;
            });

            this.model.set('files', files);
        },

        applyFileToAllBranches : function (event) {
            let checkbox = event.target;
            let files = this.model.get('files') || [];
            let tempFiles = this.model.get('tempFiles') || [];
            files = files.concat(tempFiles);
            let container;

            if (!files || !files.length) {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    return App.renderErrors([
                        ERROR_MESSAGES.fileNotSelected[App.currentUser.currentLanguage]
                    ]);
                } else {
                    return;
                }
            }

            if (files.length > 1) {
                checkbox.checked = false;
                return App.renderErrors([
                    ERROR_MESSAGES.selectOneFile[App.currentUser.currentLanguage]
                ]);
            }

            const file = files[0];

            if (file.contentType === 'video') {
                container = '<video width="400" controls><source src="' + file.url + '"></video>';
            } else {
                container = '<img id="myImg" class="imgResponsive" src="' + file.url + '">';
            }

            if (checkbox.checked) {
                this.$el.find('.bannerImage').html(container);
                this.$el.find('.close').addClass('hidden');
                this.$el.find('.uploadInput').attr('disabled', true);

                if (this.forEdit) {
                    this.model.set('fileToAllBranches', file._id);
                }

                this.model.set('applyFileToAll', true);
            } else {
                this.$el.find('.bannerImage').html('');
                this.$el.find(`#imageMy-${file.branch}`).html(container);
                this.$el.find(`#removeFile-${file.branch}`).removeClass('hidden');
                this.$el.find('.uploadInput').attr('disabled', false);

                this.model.unset('fileToAllBranches');

                this.model.unset('applyFileToAll');
            }
        },

        removeFile: function (e) {
            var $target = $(e.target);
            var branchId = e.target.id.substring(e.target.id.lastIndexOf('-') + 1, e.target.id.length);

            var fileContainerHolder = this.$el.find('#imageMy-' + branchId);
            fileContainerHolder.html('');

            var fileInput = this.$el.find('#branch-photo-' + branchId);
            fileInput[0].value = null;

            $target.addClass('hidden');

            //delete from temp file objects storage
            var tempAddedFiles = this.model.get('tempFiles');
            if (tempAddedFiles) {
                var tempFileToDeleteIndex = tempAddedFiles.map((item) => {
                    return item.branch;
                }).indexOf(branchId);
                if (tempFileToDeleteIndex > -1) {
                    tempAddedFiles.splice(tempFileToDeleteIndex, 1);
                }
            }

            //delete from temp storage of real files
            var tempRealFiles = this.model.get('tempRealFiles');
            if (tempRealFiles[branchId]) {
                delete tempRealFiles[branchId];
            }

            //delete from file objects storage
            var addedFiles = this.model.get('files');
            if (addedFiles) {
                var fileToDeleteIndex = addedFiles.map((item) => {
                    return item.branch;
                }).indexOf(branchId);
                if (fileToDeleteIndex > -1) {
                    var fileToTempRemovedFiles = addedFiles.splice(fileToDeleteIndex, 1);
                    var tempRemovedFiles = this.model.get('tempRemovedFiles');
                    if (!tempRemovedFiles) {
                        tempRemovedFiles = fileToTempRemovedFiles;
                    } else {
                        tempRemovedFiles = tempRemovedFiles.concat(fileToTempRemovedFiles);
                    }
                    this.model.set('tempRemovedFiles', tempRemovedFiles);
                }
            }

            //delete from storage of real files
            var realFiles = this.model.get('realFiles');
            if (realFiles[branchId]) {
                var tempRemovedRealFiles = this.model.get('tempRemovedRealFiles');
                if (!tempRemovedRealFiles) {
                    tempRemovedRealFiles = {};
                    this.model.set('tempRemovedRealFiles', tempRemovedRealFiles);
                }
                tempRemovedRealFiles[branchId] = realFiles[branchId];
                delete realFiles[branchId];
            }

            var tempClearBranch = this.model.get('tempClearBranch');
            if (tempClearBranch) {
                tempClearBranch.push(branchId);
            } else {
                this.model.set('tempClearBranch', [branchId]);
            }
        },

        formSend: function (e) {
            var context = e.data.context;
            var $curEl = context.$el;
            var errorsLength = Object.keys(context.errors).length;
            var ajaxObj;
            var newAfterDescription;
            e.preventDefault();

            if (errorsLength) {
                for (var key in context.errors) {
                    App.render(context.errors[key]);
                }

                return false;
            }

            if (context.editAfter) {
                newAfterDescription = $curEl.find('#afterForm').val();

                if (context.newFileUploaded || !context.oldAjaxObj) {
                    context.model.set('descriptionAfter', newAfterDescription);

                    ajaxObj = {
                        model      : context.model,
                        url        : 'form/visibility/' + context.model.get('_id'),
                        type       : 'PATCH',
                        data       : data,
                        contentType: false,
                        processData: false
                    };
                } else {
                    if (newAfterDescription !== context.model.get('after').description) {
                        context.model.set('descriptionAfter', newAfterDescription);

                        if (context.oldAjaxObj) {
                            context.oldAjaxObj.data.append('description', newAfterDescription);
                            context.oldAjaxObj.model = context.model;
                        }

                        ajaxObj = context.oldAjaxObj;
                    }
                }

            } else {
                var data = new FormData();
                var realFiles = context.model.get('realFiles');
                $.each(realFiles, function (key, value) {
                    data.append(key, value);
                });

                ajaxObj = {
                    model : context.model,
                    data : data
                };
            }

            if (ajaxObj) {
                context.trigger('visibilityFormEdit', ajaxObj);
            }

            this.newFileUploaded = false;

            $curEl.dialog('close').dialog('destroy').remove();
        },

        imageIsLoaded: function (branchId, fileName, e) {
            var res = e.target.result;
            var container;
            var type = res.substr(0, 10);

            if (type === 'data:video') {
                container = '<video width="400" controls><source src="' + res + '"></video>';
            } else {
                container = '<img id="myImg" class="imgResponsive" src="' + res + '">';
            }

            if (this.editAfter) {
                this.model.set('filesAfter', {
                    url        : res,
                    contentType: type.substr(5, 5)
                });
            } else {
                const tempAddedFiles = this.model.get('tempFiles');
                if (!tempAddedFiles) {
                    this.model.set('tempFiles', [{
                        url        : res,
                        contentType: type.substr(5, 5),
                        branch : branchId,
                        fileName : fileName
                    }]);
                } else {
                    tempAddedFiles.push({
                        url        : res,
                        contentType: type.substr(5, 5),
                        branch : branchId,
                        fileName : fileName
                    });
                }
            }

            this.$el.find(`#imageMy-${branchId}`).html(container);
            this.$el.find(`#removeFile-${branchId}`).removeClass('hidden');
        },

        imageTest: function (e) {
            e.preventDefault();

            var self = this;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
            var input = e.target;
            var fileSizeMax = 20000000;
            var reader;
            var file;
            var error;
            var currentBranchId;
            var fileName;

            if (input.files && input.files[0]) {
                file = input.files[0];
                if (file.size > fileSizeMax) {
                    App.render({type: 'alert', message: ERROR_MESSAGES.fileSizeLimitReached[currentLanguage]});

                    this.errors = {file: error};
                } else {
                    currentBranchId = input.id.substring(input.id.lastIndexOf('-') + 1, input.id.length);
                    var tempRealFiles = self.model.get('tempRealFiles');
                    tempRealFiles[currentBranchId] = file;
                    fileName = file.name;
                    delete this.errors.file;
                }

                reader = new FileReader();

                reader.readAsDataURL(input.files[0]);
                reader.onload = _.bind(self.imageIsLoaded, self, currentBranchId, fileName);
                this.newFileUploaded = true;
            }
            this.files = input.files;
        },

        saveData: function () {
            this.$el.find('#mainVisForm').submit();
        },

        render: function () {
            var allowed = CONSTANTS.IMAGE_CONTENT_TYPES.concat(CONSTANTS.VIDEO_CONTENT_TYPES).join(', ');
            var self = this;
            var $formString;
            var before = this.model.get('before') || {};
            var after = this.model.get('after') || {};
            var savedFiles = this.model.get('files');
            var savedAfterFiles = this.model.get('filesAfter');
            var descriptionAfter = this.model.get('descriptionAfter');
            var files = savedFiles ? savedFiles : before.files || {};
            var filesAfter = savedAfterFiles ? savedAfterFiles : after.files || {};
            const applyFileToAll = this.model.get('applyFileToAll');

            if (this.editAfter) {
                descriptionAfter = descriptionAfter ? descriptionAfter : after.description || '';

                this.model.set({
                    after: {
                        description: descriptionAfter,
                        files      : filesAfter
                    }
                });

                this.model.set({
                    before: {
                        description: this.description,
                        files      : before.files
                    }
                });

                $formString = $(self.templateAfter({
                    model      : this.model.toJSON(),
                    branchName : this.branchName,
                    allowed    : allowed,
                    translation: this.translation
                }));
            } else {
                let oldFiles = this.model.get('files') || [];

                this.outlets = this.outlets.map((outlet) => {
                    outlet.branches.map((branch) => {
                        delete branch.fileContainer;

                        oldFiles.map((file) => {
                            if (file.branch === branch._id) {
                                let type = file.contentType;
                                let container;

                                if (type === 'data:video' || type === 'video') {
                                    container = '<video width="400" controls><source src="' + file.url + '"></video>';
                                } else {
                                    container = '<img id="myImg" class="imgResponsive" src="' + file.url + '">';
                                }

                                branch.fileContainer = container;
                            }
                        });
                    });

                    return outlet;
                });

                $formString = $(self.template({
                    description: this.description,
                    outlets    : this.outlets,
                    allowed    : allowed,
                    translation: this.translation
                }));
            }

            this.$el = $formString.dialog({
                width      : 'auto',
                dialogClass: 'edit-dialog visibilityFormHeight',
                buttons    : {
                    save: {
                        text : self.translation.saveBtn,
                        click: function () {
                            async.parallel([
                                function (cb) {
                                    //confirm save temp file
                                    var tempFiles = self.model.get('tempFiles');
                                    var files = self.model.get('files');

                                    if (!files) {
                                        files = [];
                                    }

                                    if (!tempFiles) {
                                        tempFiles = [];
                                    }

                                    files = files.concat(tempFiles);
                                    self.model.set('files', files);

                                    self.model.unset('tempFiles');

                                    cb();
                                },

                                function (cb) {
                                    //confirm save temp real files
                                    var tempRealFiles = self.model.get('tempRealFiles');
                                    var realFiles = self.model.get('realFiles');

                                    realFiles = Object.assign({}, realFiles, tempRealFiles);
                                    self.model.set('realFiles', realFiles);

                                    self.model.unset('tempRealFiles');

                                    cb();
                                },

                                function (cb) {
                                    //confirm remove files
                                    self.model.unset('tempRemovedFiles');
                                    self.model.unset('tempRemovedRealFiles');

                                    cb();
                                }
                            ], function () {
                                //define branches to delete
                                var tempClearBranch = self.model.get('tempClearBranch') || [];
                                var clearBranch = self.model.get('clearBranch') || [];

                                clearBranch = clearBranch.concat(tempClearBranch);

                                if (clearBranch && clearBranch.length) {
                                    self.model.set('clearBranch', clearBranch);
                                } else {
                                    self.model.unset('clearBranch');
                                }

                                self.model.unset('tempClearBranch');

                                //save model
                                self.saveData();
                            });
                        }
                    },

                    cancel: {
                        text : self.translation.cancelBtn,
                        click: function() {
                            self.model.unset('tempFiles');
                            self.model.unset('tempRealFiles');
                            self.model.unset('tempClearBranch');

                            var tempRemovedFiles = self.model.get('tempRemovedFiles');
                            var tempRemovedRealFiles = self.model.get('tempRemovedRealFiles');
                            var files = self.model.get('files');
                            var realFiles = self.model.get('realFiles');

                            if (tempRemovedFiles) {
                                files = files.concat(tempRemovedFiles);
                                self.model.set('files', files);
                            }

                            if (tempRemovedRealFiles) {
                                realFiles = Object.assign({}, realFiles, tempRemovedRealFiles);
                                self.model.set('realFiles', tempRemovedRealFiles);
                            }

                            self.model.set('applyFileToAll', self.model.get('originalApplyStatus'));

                            self.$el.dialog('close');
                        }
                    }
                }
            });

            this.$el.find('#mainVisForm').on('submit', {context: this}, this.formSend);

            this.outlets.map((outlet) => {
                outlet.branches.map((branch) => {
                    self.$el.find(`#branch-photo-${branch._id}`).bind('change', self.imageTest.bind(self));
                    self.$el.find(`#removeFile-${branch._id}`).bind('click', self.removeFile.bind(self));
                });
            });

            if (applyFileToAll) {
                const file = savedFiles[0];
                let container;

                if (file.contentType === 'video') {
                    container = '<video width="400" controls><source src="' + file.url + '"></video>';
                } else {
                    container = '<img id="myImg" class="imgResponsive" src="' + file.url + '">';
                }

                this.$el.find('#apply-to-all').attr('checked', true);
                this.$el.find('.bannerImage').html(container);
                this.$el.find('.close').addClass('hidden');
                this.$el.find('.uploadInput').attr('disabled', true);
            }

            /*if (!Object.keys(files).length) {
                this.$el.find('#removeFile').addClass('hidden');
            }*/

            this.delegateEvents(this.events);
            return this;
        }
    });
    return manageView;
});
