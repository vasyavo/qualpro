define([
    'backbone',
    'Underscore',
    'jQuery',
    'text!templates/objectives/edit.html',
    'text!templates/objectives/form/form.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'models/objectives',
    'populate',
    'views/objectives/linkFormView',
    'collections/filter/filterCollection',
    'collections/file/collection',
    'models/file',
    'views/personnel/listForSelection',
    'views/filter/treeView',
    'helpers/implementShowHideArabicInputIn',
    'constants/otherConstants',
    'dataService',
    'moment',
    'views/objectives/visibilityForm/editView',
    'views/objectives/visibilityForm/editViewWithoutBranches',
    'views/fileDialog/fileDialog',
    'async',
    'constants/contentType',
    'helpers/objectivesStatusHelper',
    'constants/errorMessages',
    'constants/aclRoleIndexes'
], function (Backbone, _, $, EditTemplate, FormTemplate, FileTemplate, BaseView, FileDialogView, Model,
             populate, LinkFormView, FilterCollection, FileCollection, FileModel, PersonnelListForSelectionView, TreeView,
             implementShowHideArabicInputIn, CONSTANTS, dataService, moment, VisibilityEditView, VisibilityEditViewWithoutBranches,
             FileDialogPreviewView, async, CONTENT_TYPES, objectivesStatusHelper, ERROR_MESSAGES, ACL_ROLE_INDEXES) {

    var EditView = BaseView.extend({
        contentType: CONTENT_TYPES.OBJECTIVES,
        updateCount: 0,

        template             : _.template(EditTemplate),
        formTemplate         : _.template(FormTemplate),
        fileTemplate         : _.template(FileTemplate),
        ALLOWED_CONTENT_TYPES: _.union(CONSTANTS.IMAGE_CONTENT_TYPES, CONSTANTS.MS_WORD_CONTENT_TYPES, CONSTANTS.MS_EXCEL_CONTENT_TYPES, CONSTANTS.OTHER_FORMATS, CONSTANTS.VIDEO_CONTENT_TYPES),

        locations: {
            country      : [],
            region       : [],
            subRegion    : [],
            retailSegment: [],
            outlet       : [],
            branch       : []
        },

        fileForVFWithoutBranches : {},

        events: {
            'click #assignDd'            : 'showPersonnelView',
            'click #attachFile'          : 'showAttachDialog',
            'input #title, #titleAr'     : 'changeTitle',
            'change #dateStart, #dateEnd': 'changeDate',
            'click #unlinkForm'          : 'showUnlinkPopUp',
            //events for duplicate
            'click #attachForm'          : 'showLinkFormDialog',
            'click #actionHolder:not(ul)': 'showHideActionDropdown',
            'click .formThumbnail'       : 'openForm',
            'click .fileThumbnailItem'   : 'showFilePreviewDialog',
            'click #downloadFile'        : 'stopPropagation'
        },

        initialize: function (options) {
            var self = this;
            var parent;

            options = options || {};

            this.translation = options.translation;
            this.duplicate = options.duplicate;
            this.model = options.model.toJSON ? options.model : new Model(options.model, {parse: true});
            this.changed = {};

            var assigne = this.model.get('assignedTo')[0];

            this.assigneWithoutBranches = [ACL_ROLE_INDEXES.SALES_MAN, ACL_ROLE_INDEXES.MERCHANDISER, ACL_ROLE_INDEXES.CASH_VAN].indexOf(assigne.accessRole.level) === -1;

            parent = this.model.get('parent');
            this.parentObjectiveId = parent && parent[App.currentUser.accessRole.level - 1];
            if (this.duplicate) {
                this.model.unset('attachments');
            }
            this.attachments = _.pluck(this.model.get('attachments'), '_id');
            this.files = new FileCollection(this.model.get('attachments'), true);
            this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
            this.makeRender();

            if (this.parentObjectiveId) {
                dataService.getData(this.contentType + '/' + this.parentObjectiveId, {}, function (err, response) {
                    var parrentFiles = response.attachments;

                    if (err) {
                        return App.render({type: 'error', message: err.message});
                    }

                    self.files.setAndUpdateModels(parrentFiles, false);
                    self.render();
                    self.setSelectedFiles();

                });
            } else {
                self.render();
                if (!this.duplicate) {
                    self.setSelectedFiles();
                }
            }

            _.bindAll(this, 'fileSelected');
        },

        showFilePreviewDialog: function (e) {
            var $el = $(e.target);
            var $thumbnail = $el.closest('.masonryThumbnail');
            var fileModelId = $thumbnail.attr('data-id');
            var fileModel = this.files.get(fileModelId);

            this.fileDialogView = new FileDialogPreviewView({
                fileModel  : fileModel,
                translation: this.translation
            });
            this.fileDialogView.on('download', function (options) {
                var url = options.url;
                var originalName = options.originalName;
                var $fileElement;
                $thumbnail.append('<a class="hidden" id="downloadFile" href="' + url + '" download="' + originalName + '"></a>');
                $fileElement = $thumbnail.find('#downloadFile');
                $fileElement[0].click();
                $fileElement.remove();
            });
        },

        showUnlinkPopUp: function () {
            var self = this;

            App.showPopUp({
                contentType: this.contentType,
                action     : 'unlinkForm',
                saveTitle  : 'Ok',
                saveCb     : function () {
                    self.unlinkForm();
                    $(this).dialog('close').dialog('destroy').remove();
                }
            });
        },

        unlinkForm: function () {
            var $el = this.$el;

            this.linkedForm = null;
            this.branchesForVisibility = [];
            this.savedVisibilityModel = null;
            this.visibilityFormAjax = null;
            $el.find('#formThumbnail').html('');
            $el.find('.formBlock').hide();
            this.showLinkForm();
        },

        openForm: function () {
            var modelJSON = this.model.toJSON();
            var form;
            var id;
            var contentType;
            var description;
            var self = this;
            var formOptions;

            if (modelJSON.status._id !== 'draft') {
                return;
            }

            if (this.duplicate) {
                form = this.linkedForm;
                contentType = form._id;
            } else {
                form = modelJSON.form;
                id = form._id;
                contentType = form.contentType;
            }

            if (contentType === 'visibility' && modelJSON.createdBy.user._id === App.currentUser._id) {
                description = {
                    en: this.$el.find('.objectivesTextarea[data-property="en"]').val(),
                    ar: this.$el.find('.objectivesTextarea[data-property="ar"]').val()
                };

                var currentLanguage =  App.currentUser.currentLanguage;

                if (self.assigneWithoutBranches) {
                    var form = self.model.get('form');
                    if (form) {
                        function showVF() {
                            this.visibilityForm = new VisibilityEditViewWithoutBranches({
                                description : description[App.currentUser.currentLanguage],
                                locationString : self.model.get('location'),
                                translation : self.translation,
                                previewOfSelectedFile : self.fileForVFWithoutBranches.preview
                            });

                            this.visibilityForm.on('save', function (fileModel) {
                                self.fileForVFWithoutBranches = fileModel;
                                self.VFWithoutBranchesChanged = true;
                            });

                            this.visibilityForm.on('delete-file', function () {
                                self.fileForVFWithoutBranches = {};
                                self.VFWithoutBranchesChanged = true;
                            });
                        }

                        if (self.fileForVFWithoutBranches.preview || self.VFWithoutBranchesChanged) {
                            showVF();
                        } else {
                            var formId = form._id;
                            $.getJSON('/form/visibility/' + formId)
                                .success(function (response) {
                                    var file = response.before.files[0];

                                    if (file) {
                                        var container;
                                        var fileType = file.contentType.substr(0, 5);

                                        if (fileType === 'video') {
                                            container = '<video width="400" controls><source src="' + file.url + '"></video>';
                                        } else {
                                            container = '<img id="myImg" class="imgResponsive" src="' + file.url + '">';
                                        }

                                        self.fileForVFWithoutBranches.preview = container;
                                    }

                                    showVF();
                                })
                                .error(function () {
                                    return App.render({
                                        type   : 'alert',
                                        message: ERROR_MESSAGES.readError[currentLanguage]
                                    });
                                });
                        }
                    } else {
                        return App.render({
                            type   : 'alert',
                            message: ERROR_MESSAGES.nothingToShow[currentLanguage]
                        });
                    }
                } else {
                    this.branchesForVisibility = modelJSON.branch;
                    this.outletsForVisibility = _.map(modelJSON.outlet, function (outlet) {
                        let result = {
                            name : outlet.name[currentLanguage],
                            _id : outlet._id,
                            branches : []
                        };

                        self.branchesForVisibility.map((branch) => {
                            if (outlet._id === branch.outlet) {
                                result.branches.push({
                                    name : branch.name[currentLanguage],
                                    _id : branch._id
                                });
                            }
                        });

                        return result;
                    });

                    formOptions = {
                        forEdit : true,
                        outlets : this.outletsForVisibility,
                        description : description,
                        savedVisibilityModel : this.savedVisibilityModel,
                        oldAjaxObj : this.visibilityFormAjax,
                        translation : self.translation
                    };

                    if (this.duplicate) {
                        formOptions.forCreate = true;
                    } else {
                        formOptions.id = id;
                    }

                    this.visibilityForm = new VisibilityEditView(formOptions);
                    this.visibilityForm.on('visibilityFormEdit', function (ajaxObj) {
                        self.visibilityFormAjax = ajaxObj;
                        self.savedVisibilityModel = ajaxObj.model;
                    });
                }
            } else {
                App.render({
                    type   : 'alert',
                    message: ERROR_MESSAGES.youHaveNoRights[self.currentLanguage] + ' ' + self.linkedForm.name[self.currentLanguage] + ' ' + this.translation.form
                });
            }
        },

        showLinkFormDialog: function () {
            var self = this;
            var assignedToCount = self.changed.assignedTo ? self.changed.assignedTo.length : 0;

            this.linkFormView = new LinkFormView({
                assignedToCount         : assignedToCount,
                individual              : (this.model.get('objectiveType') === 'individual'),
                dontShowDistributionForm: this.dontShowDistributionForm,
                translation             : self.translation
            });

            this.linkFormView.on('formLinked', function (modelJSON) {
                self.linkedForm = modelJSON;

                self.$el.find('#formThumbnail').append(self.formTemplate({
                    name       : modelJSON.name[self.currentLanguage],
                    id         : modelJSON._id,
                    translation: self.translation
                }));

                self.$el.find('.formBlock').show();
                self.hideLinkForm();
            });
        },

        onDuplicate: function (options) {
            var self = this;
            var $curEl = this.$el;
            var startDate = $curEl.find('#dateStart').val();
            var endDate = $curEl.find('#dateEnd').val();
            startDate = startDate ? moment(startDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 0).set('minute', 1).toISOString() : null;
            endDate = endDate ? moment(endDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 23).set('minute', 59).toISOString() : null;
            this.checkForEmptyInput(this.files, this.$el);

            this.changed = {
                title        : {
                    en: $curEl.find('#title').val(),
                    ar: $curEl.find('#titleAr').val()
                },
                objectiveType: $curEl.find('#typeDd').attr('data-id'),
                assignedTo   : this.changed.assignedTo,
                saveObjective: !!options.save,
                priority     : $curEl.find('#priorityDd').attr('data-id'),
                dateStart    : startDate,
                dateEnd      : endDate,
                location     : $curEl.find('#personnelLocation').attr('data-location'),
                description  : {
                    en: $curEl.find('.objectivesTextarea[data-property="en"]').val(),
                    ar: $curEl.find('.objectivesTextarea[data-property="ar"]').val()
                },
                country      : this.locations.country,
                region       : this.locations.region,
                subRegion    : this.locations.subRegion,
                retailSegment: this.locations.retailSegment,
                outlet       : this.locations.outlet,
                branch       : this.locations.branch
            };

            if (this.linkedForm) {
                this.changed.formType = this.linkedForm._id;
            }

            this.model.setFieldsNames(this.translation);

            this.model.validate(this.changed, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    self.$el.find('#mainForm').submit();
                }
            });
        },

        hideLinkForm: function () {
            var $liEl = this.$el.find('#attachForm');

            $liEl.addClass('hidden');
            this.showUnlinkForm();
        },

        showUnlinkForm: function () {
            var $liEl = this.$el.find('#unlinkForm');

            $liEl.removeClass('hidden');
        },

        hideUnlinkForm: function () {
            var $liEl = this.$el.find('#unlinkForm');

            $liEl.addClass('hidden');
        },

        showLinkForm: function () {
            var $liEl = this.$el.find('#attachForm');

            $liEl.removeClass('hidden');
            this.hideUnlinkForm();
        },

        changeDate: function (e) {
            var $el = $(e.target);
            var id = $el.attr('id');
            var val = $el.val();

            val = moment(val, 'DD.MM.YYYY').toISOString();

            id === 'dateStart' ? this.changed.dateStart = val : this.changed.dateEnd = val;
        },

        changeDesc: function (e) {
            var jsonModel = this.model.toJSON();
            var $editor = e.editor;
            var name = $editor.name;
            var val = $editor.getData();

            this.changed.description = jsonModel.description || {};
            name === 'descriptionEn' ? this.changed.description.en = val : this.changed.description.ar = val;
        },

        changeTitle: function (e) {
            var jsonModel = this.model.toJSON();
            var $el = $(e.target);
            var id = $el.attr('id');
            var val = $el.val();

            this.changed.title = jsonModel.title || {};
            id === 'titleEn' ? this.changed.title.en = val : this.changed.title.ar = val;
        },

        changeItem: function (data) {
            var id = data.$selector.attr('id');
            var itemId = data.model._id;
            var $personnelLocation = this.$el.find('#personnelLocation');
            var $assignPersonnel = this.$el.find('#assignDd');

            if (id === 'statusDd') {
                this.changed.status = itemId;
            } else if (id === 'typeDd') {

                if (this.objectiveTypes.length === 1) {
                    return;
                }

                this.changed.objectiveType = null;
                this.changed.location = '';
                this.changed.assignedTo = [];

                $personnelLocation.html('');
                $personnelLocation.attr('data-location', '');
                $assignPersonnel.html('Select personnel');

                this.changed.objectiveType = itemId;
            } else if (id === 'priorityDd') {
                this.changed.priority = itemId;
            }
        },

        addFile: function (file) {
            var fileId = file.get('_id');
            var $curEl = this.$el;

            if (fileId) {
                this.attachments.push(fileId);
            }

            $curEl.find('#fileThumbnail').append(this.fileTemplate({
                model: file
            }));

            $curEl.find('#filesBlock').show();
        },

        formSubmit: function (e) {
            var self = this;
            var context = e.data.context;
            var currentLanguage = App.currentUser.currentLanguage;

            e.preventDefault();

            async.waterfall([
                function (cb) {
                    var data = new FormData(self);
                    var ajaxData = {
                        url        : context.model.url(),
                        data       : data,
                        contentType: false,
                        processData: false,
                        success    : function (xhr) {
                            var model = new Model(xhr, {parse: true});

                            cb(null, model);
                        },
                        error      : function () {
                            cb(true);
                        }
                    };

                    if (context.changed.assignedTo && context.changed.assignedTo.length === 0) {
                        return App.render({type: 'error', message: ERROR_MESSAGES.selectPersonnel[currentLanguage]});
                    }

                    if (!context.duplicate) {
                        data.append('data', JSON.stringify({
                            changed    : context.changed,
                            attachments: context.attachments
                        }));
                        ajaxData.type = 'PUT';
                    } else {
                        data.append('data', JSON.stringify(context.changed));
                        ajaxData.type = 'POST';
                    }

                    $.ajax(ajaxData);
                },

                function (model, cb) {
                    if (context.assigneWithoutBranches) {
                        var file = context.fileForVFWithoutBranches.file;

                        if (file) {
                            var dataWithoutBranches = new FormData();
                            dataWithoutBranches.append('file', file);

                            $.ajax({
                                url : '/file',
                                method : 'POST',
                                data : dataWithoutBranches,
                                contentType: false,
                                processData: false,
                                success : function (response) {
                                    cb(null, model, response);
                                },
                                error : function () {
                                    cb(true);
                                }
                            });
                        } else {
                            return cb(null, model, {
                                files : []
                            });
                        }
                    } else {
                        var visibilityFormAjax = context.visibilityFormAjax;
                        var VFData = null;
                        var files = [];

                        context.branchesForVisibility.map(function (item) {

                        });

                        if (visibilityFormAjax) {
                            VFData = context.visibilityFormAjax.data;
                        }

                        if (VFData) {
                            files = context.branchesForVisibility.map(function (item) {
                                return VFData.get(item._id);
                            }).filter(function (item) {
                                return item;
                            });
                        }

                        if (files && files.length) {
                            $.ajax({
                                url : '/file',
                                method : 'POST',
                                data : VFData,
                                contentType: false,
                                processData: false,
                                success : function (response) {
                                    cb(null, model, response);
                                },
                                error : function () {
                                    cb(true);
                                }
                            });
                        } else {
                            return cb(null, model, {
                                files : []
                            });
                        }
                    }
                },

                function (model, files, cb) {
                    var form = odel.get('form');
                    var formId = form._id;
                    var formType = form.contentType;

                    if (!context.visibilityFormAjax && !context.VFWithoutBranchesChanged) {
                        if (formType === 'visibility') {
                            $.ajax({
                                url : 'form/visibility/before/' + formId,
                                method : 'PUT',
                                contentType : 'application/json',
                                dataType : 'json',
                                data : JSON.stringify({
                                    before : {
                                        files : []
                                    }
                                }),
                                success : function () {
                                    cb(null, model);
                                },
                                error : function () {
                                    cb(null, model);
                                }
                            });
                        }
                    }

                    var requestPayload;

                    if (context.assigneWithoutBranches) {
                        var file = files.files[0];

                        if (file) {
                            requestPayload = {
                                before : {
                                    files : [file._id]
                                }
                            };
                        } else {
                            if (context.fileForVFWithoutBranches.preview) {
                                return cb(null, model);
                            } else {
                                requestPayload = {
                                    before : {
                                        files : []
                                    }
                                };
                            }
                        }
                    } else {
                        if (context.visibilityFormAjax && context.visibilityFormAjax.model && context.visibilityFormAjax.model.get('applyFileToAll') && files.files[0]) {
                            var branches = context.branchesForVisibility;
                            requestPayload = {
                                before: {
                                    files: []
                                },
                                after: {
                                    description: '',
                                    files: []
                                },
                                branches: branches.map(function (item) {
                                    return {
                                        branchId: item._id,
                                        before: {
                                            files: [files.files[0]._id]
                                        },
                                        after: {
                                            files: [],
                                            description: ''
                                        }
                                    };
                                })
                            };
                        } else if (context.visibilityFormAjax && context.visibilityFormAjax.model && context.visibilityFormAjax.model.get('applyFileToAll') && !files.files[0]) {
                            var fileToAllBranches = context.visibilityFormAjax.model.get('fileToAllBranches');
                            var branches = context.branchesForVisibility;

                            requestPayload = {
                                before: {
                                    files: []
                                },
                                after: {
                                    description: '',
                                    files: []
                                },
                                branches: branches.map(function (item) {
                                    return {
                                        branchId: item._id,
                                        before: {
                                            files: [fileToAllBranches]
                                        },
                                        after: {
                                            files: [],
                                            description: ''
                                        }
                                    };
                                })
                            };
                        } else {
                            var modelFiles = (context.visibilityFormAjax && context.visibilityFormAjax.model) ? context.visibilityFormAjax.model.get('files') || [] : [];
                            var clearBranch = (context.visibilityFormAjax && context.visibilityFormAjax.model) ? context.visibilityFormAjax.model.get('clearBranch') || [] : [];
                            var result = modelFiles.map(function (item) {
                                var fileFromServer = _.findWhere(files.files, {
                                    originalName: item.fileName
                                });

                                if (fileFromServer) {
                                    return {
                                        branchId: item.branch,
                                        before : {
                                            files: [fileFromServer._id]
                                        },
                                        after : {
                                            files : [],
                                            description : ''
                                        }
                                    };
                                }

                                return {
                                    branchId : item.branch,
                                    before : {
                                        files : [item._id]
                                    },
                                    after : {
                                        files : [],
                                        description : ''
                                    }
                                };
                            });

                            clearBranch.map(function (item) {
                                var branchModel = _.find(result, function (branch) {
                                    return branch.branchId === item;
                                });

                                if (!branchModel) {
                                    result.push({
                                        branchId : item,
                                        before : {
                                            files : []
                                        }
                                    });
                                }
                            });

                            requestPayload = {
                                before : {
                                    files : []
                                },
                                after : {
                                    files : [],
                                    description : ''
                                },
                                branches : result
                            };
                        }
                    }

                    if (formType === 'visibility') {
                        $.ajax({
                            url : 'form/visibility/before/' + formId,
                            method : 'PUT',
                            contentType : 'application/json',
                            dataType : 'json',
                            data : JSON.stringify(requestPayload),
                            success : function () {
                                cb(null, model);
                            },
                            error : function () {
                                cb(true);
                            }
                        });
                    } else {
                        cb(null, model);
                    }
                }
            ], function (err, model) {
                if (err) {
                    return App.render({type: 'error', message: ERROR_MESSAGES.objectiveNotSaved[currentLanguage]});
                }

                context.trigger('modelSaved', model);
                context.$el.dialog('close').dialog('destroy').remove();
            });
        },

        showAttachDialog: function () {
            if (this.parentObjectiveId) {
                this.fileDialogView = new FileDialogView({
                    haveParent : true,
                    files      : this.files,
                    contentType: this.contentType,
                    translation: this.translation,
                    dialogTitle: this.translation.dialogTitle,
                    buttonName : this.translation.attach
                });
            } else {
                this.fileDialogView = new FileDialogView({
                    files      : this.files,
                    translation: this.translation
                });
            }

            this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
            this.fileDialogView.on('removeFile', this.removeFile, this);
            this.fileDialogView.on('addFile', this.addFile, this);
        },

        removeFile: function (file) {
            var fileId = file.get('_id') || file.cid;
            var $thumbnail = this.$el.find('.fileThumbnailItem[data-id = "' + fileId + '"]');
            var self = this;

            $thumbnail.remove();
            --this.updateCount;
            this.attachments = _.without(this.attachments, fileId);

            if (!file.uploaded) {
                this.files.remove(file, {silent: true});
                this.$el.find('#' + file.cid).remove();

                if (!this.files.getSelected({selected: true}).length) {
                    this.$el.find('#filesBlock').hide();
                }
            } else {
                dataService.deleteData(file.url, {
                    fileId     : fileId,
                    objectiveId: this.model.get('_id')
                }, function (err) {
                    if (err) {
                        App.render(err);
                    }

                    if (!self.parentObjectiveId) {
                        self.files.remove(file, {silent: true});
                        self.$el.find('#' + file.cid).remove();
                    }

                    if (!self.files.getSelected({selected: true}).length) {
                        self.$el.find('#filesBlock').hide();
                    }
                });
            }
        },

        setSelectedFiles: function () {
            var self = this;
            var model = this.model.toJSON();

            model.attachments.forEach(function (attachment) {
                self.$el.find('#fileThumbnail').append(self.fileTemplate({
                    model: attachment
                }));
            });

            this.$el.find('.filesBlock').show();
            App.masonryGrid.call(self.$el);
        },

        fileSelected: function (e) {
            var self = this;
            var data = e.data;
            var $fileInput = $(data.fileInput);
            var fileCid = $fileInput.attr('id');
            var fileModel = this.files.get(fileCid);
            var reader = new FileReader();
            var currentLanguage = App.currentUser.currentLanguage;

            reader.readAsDataURL(e.target.files[0]);

            reader.onload = function (elem) {
                var result = elem.target.result;
                var selectedFile;
                var type;
                var model;
                if (!result) {
                    self.files.remove(fileModel);
                    return;
                }

                type = $fileInput.prop('files')[0].type;

                if (self.ALLOWED_CONTENT_TYPES.indexOf(type) === -1) {
                    App.render({type: 'error', message: ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage]});
                    return;
                }

                selectedFile = {
                    name: $fileInput.prop('files')[0].name,
                    type: type
                };

                fileModel.update({
                    file    : selectedFile,
                    selected: true,
                    uploaded: true
                });

                if (fileModel.getTypeFromContentType(type) === 'image_icon') {
                    fileModel.set({preview: result});
                }
                model = fileModel.toJSON();
                model.cid = fileCid;
                self.$el.find('#fileThumbnail').append(self.fileTemplate({
                    model: model
                }));
                self.$el.find('.filesBlock').show();
                self.fileDialogView.trigger('fileSelected', fileModel);
                App.masonryGrid.call(self.$el);
            };

        },

        attachFile: function () {
            var fileInput;
            var fileModel = new FileModel();
            var $curEl = this.$el;

            this.files.add(fileModel);
            this.$el.find('#mainForm').append('<input accept="' + this.ALLOWED_CONTENT_TYPES.join(', ') + '" type="file" name="' + fileModel.cid + '" id="' + fileModel.cid + '" style="display: none">');
            fileInput = $curEl.find('#' + fileModel.cid);
            fileInput.on('change', {fileInput: fileInput}, this.fileSelected);
            fileInput.click();
        },

        locationSelected: function (data) {
            var $personnelLocation = this.$el.find('#personnelLocation');
            var locations = this.locations;

            locations.country = data.country;
            locations.region = data.region;
            locations.subRegion = data.subRegion;
            locations.retailSegment = data.retailSegment;
            locations.outlet = data.outlet;
            locations.branch = data.branch;

            $personnelLocation.html(data.location);
            $personnelLocation.attr('data-location', data.location);

            this.changed.location = data.location;

            if (this.duplicate) {
                this.branchesForVisibility = _.filter(this.branchesForVisibility, function (branch) {
                    return self.locations.branch.indexOf(branch._id) !== -1;
                });
                this.branchesForVisibility = _.uniq(this.branchesForVisibility, false, function (item) {
                    return item._id;
                });
                this.branchesForVisibility = _.map(this.branchesForVisibility, function (branch) {
                    return branch.name.currentLanguage;
                });
            }
        },

        showPersonnelView: function () {
            var personnelLocation = this.$el.find('#personnelLocation');
            var self = this;
            var creationsOptions = {
                withoutTabs       : true,
                parrentContentType: this.contentType,
                objectiveType     : this.changed.objectiveType,
                translation       : this.translation.assignToPersonnel
            };
            var createdByLevel = this.model.get('createdBy').user.accessRole.level;
            var currentLanguage = App.currentUser.currentLanguage;
            if (this.changed.objectiveType === 'individual') {
                if (this.model.get('assignedTo').length) {
                    return App.render({
                        type   : 'error',
                        message: ERROR_MESSAGES.forbiddenSelectPersonnelForIndividual[currentLanguage]
                    });
                }

                creationsOptions.multiselect = false;
            } else if (this.model.get('objectiveType') === 'individual') {
                creationsOptions.multiselect = false;
            } else if (createdByLevel === 3 || createdByLevel === 4) {
                creationsOptions.multiselect = true;
            } else {
                creationsOptions.multiselect = false;
            }

            this.personnelListForSelectionView = new PersonnelListForSelectionView(creationsOptions);

            this.personnelListForSelectionView.on('coverSaved', function (personnelCollection) {
                var jsonPersonnels = personnelCollection.toJSON();
                var personnelsIds = _.pluck(jsonPersonnels, '_id');
                var personnelsNames = _.pluck(jsonPersonnels, 'fullName').join(', ');
                var smCvMzLevels = [5, 6, 7];

                self.dontShowDistributionForm = smCvMzLevels.indexOf(jsonPersonnels[0].accessRole.level) === -1;

                self.treeView = new TreeView({
                    ids        : personnelsIds,
                    translation: self.translation
                });
                self.treeView.on('locationSelected', self.locationSelected, self);
                self.$el.find('#assignDd').html(personnelsNames);
                self.changed.assignedTo = personnelsIds;

                if (this.duplicate) {
                    self.branchesForVisibility = [];

                    jsonPersonnels.forEach(function (personnel) {
                        self.branchesForVisibility = self.branchesForVisibility.concat(personnel.branch);
                    });
                }

                if (jsonPersonnels.length && !self.linkedForm) {
                    if (App.currentUser.accessRole.level === 1 && self.changed.objectiveType !== 'individual') {
                        return;
                    }

                    self.showLinkForm();
                } else {
                    self.hideLinkForm();
                }
            });
        },

        showLinkedForm: function (form) {

            this.$el.find('#formThumbnail').append(this.formTemplate({
                name       : form.contentType.capitalizer('firstCaps') + ' Form',
                id         : form._id,
                translation: this.translation
            }));

            this.$el.find('.formBlock').show();
        },

        updateObjective: function (options, cb) {
            var self = this;
            var $curEl = this.$el;
            var model = this.model.toJSON();
            var objectiveType = $curEl.find('#typeDd').attr('data-id');
            var selectedFiles;
            var attachments;
            var files;
            var change;
            this.checkForEmptyInput(this.files, this.$el);

            if (objectiveType !== this.model.get('objectiveType')) {
                this.changed.objective = objectiveType;
            }

            files = this.files.toJSON();
            attachments = _.pluck(model.attachments, '_id');
            selectedFiles = _.where(files, {selected: true});
            selectedFiles = _.pluck(selectedFiles, '_id');

            if (selectedFiles.length) {
                change = _.difference(selectedFiles, attachments);
                if (change.length || selectedFiles.length !== attachments.length) {
                    this.changed.attachments = selectedFiles;
                } else {
                    this.updateCount = null;
                }
            } else {
                this.attachments = [];
            }

            if (!Object.keys(this.changed).length && !this.updateCount && !this.visibilityFormAjax && !this.VFWithoutBranchesChanged) {
                return cb();
            }

            this.model.setFieldsNames(this.translation, this.changed);
            this.model.validate(this.changed, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    if (self.changed.attachments) {
                        self.changed.attachments = _.compact(self.changed.attachments);
                        self.changed.attachments = self.changed.attachments.length ? self.changed.attachments : [];
                    }

                    self.changed.saveObjective = options.save;

                    self.$el.find('#mainForm').submit();
                }
            });

        },

        renderStatus: function (jsonModel) {
            var selector = '#statusDd';

            var STATUSES = CONSTANTS.OBJECTIVE_STATUSES;
            var UI_STATUSES = CONSTANTS.OBJECTIVESTATUSES_FOR_UI;
            var statusId = jsonModel.status._id;
            var createdByMe = jsonModel.createdBy.user._id === App.currentUser._id;
            var condition = (statusId === STATUSES.IN_PROGRESS && createdByMe)
                || (statusId === STATUSES.COMPLETED && !createdByMe)
                || (statusId === STATUSES.CLOSED)
                || (statusId === STATUSES.OVER_DUE && !createdByMe);

            var objectiveStatuses;
            var statusDisplayModel;

            var isUserAssignedTo;
            var statusToRemove;

            if (!this.duplicate) {
                objectiveStatuses = objectivesStatusHelper(jsonModel);
            } else {
                objectiveStatuses = [UI_STATUSES.draft, UI_STATUSES.inProgress];
            }

            statusDisplayModel = _.findWhere(objectiveStatuses, {_id: statusId});

            if (this.duplicate || condition) {
                this.$el.find(selector).after(statusDisplayModel.name.currentLanguage);
            } else {
                if (statusId === STATUSES.TO_BE_DISCUSSED) {
                    isUserAssignedTo = _.findWhere(jsonModel.assignedTo, {_id: App.currentUser._id});

                    if (isUserAssignedTo) {
                        statusToRemove = STATUSES.FAIL;
                    } else {
                        statusToRemove = STATUSES.COMPLETED;

                    }

                    objectiveStatuses = _.filter(objectiveStatuses, function (element) {
                        return (element._id !== statusToRemove);
                    });
                }

                populate.inputDropDown({
                    selector    : selector,
                    context     : this,
                    contentType : 'status',
                    displayModel: statusDisplayModel,
                    collection  : objectiveStatuses
                });
            }
        },

        render: function () {
            var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
            var descriptionIdToHide = 'description' + anotherLanguage + 'Container';
            var titleIdToHide = 'title' + anotherLanguage;
            var jsonModel = this.model.toJSON();
            var formString;
            var defaultPriority;
            var defaultType;
            var self = this;
            var $curEl;
            var dateStart = new Date();
            var dateEnd;
            var $startDate;
            var $endDate;
            var startDateObj;
            var endDateObj;

            var buttons = {
                save: {
                    text : this.translation.saveBtn,
                    class: 'btn saveBtn',
                    click: function () {
                        var that = this;
                        if (!self.duplicate) {
                            self.updateObjective({save: false}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        } else {
                            self.onDuplicate({save: true});
                        }
                    }
                },
                cancel : {
                    text : 'Cancel',
                    click : function () {
                        self.remove();
                    }
                }
            };

            if (this.duplicate) {
                buttons.send = {
                    text : this.translation.sendBtn,
                    class: 'btn sendBtn',
                    click: function () {
                        self.onDuplicate({save: false});
                    }
                };
            }

            jsonModel.duplicate = this.duplicate;
            formString = this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            });

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog',
                title      : 'Create New Objective',
                width      : '1000',
                buttons    : buttons
            });

            $curEl = this.$el;
            $startDate = $curEl.find('#dateStart');
            $endDate = $curEl.find('#dateEnd');

            $curEl.find('#' + descriptionIdToHide).hide();
            $curEl.find('#' + titleIdToHide).hide();
            $curEl.find('#filesBlock').hide();

            $curEl.find('#mainForm').on('submit', {body: this.changed, context: this}, this.formSubmit);

            startDateObj = {
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: moment(jsonModel.dateStart, 'DD.MM.YYYY').toDate(),
                onClose    : function (selectedDate) {
                    $endDate.datepicker('option', 'minDate', selectedDate);
                }
            };

            endDateObj = {
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: moment(jsonModel.dateEnd, 'DD.MM.YYYY').toDate(),
                onClose    : function (selectedDate) {
                    $startDate.datepicker('option', 'maxDate', selectedDate);
                }
            };

            if (!this.duplicate) {
                startDateObj.maxDate = new Date(dateEnd);
                endDateObj.minDate = new Date(dateStart);
            }

            $startDate.datepicker(startDateObj);
            $endDate.datepicker(endDateObj);

            implementShowHideArabicInputIn(this);

            if (App.currentUser.accessRole.level > 1 || jsonModel.objectiveType === 'individual') {
                this.objectiveTypes = [_.findWhere(CONSTANTS.OBJECTIVES_TYPE, {_id: jsonModel.objectiveType})];
                defaultType = this.objectiveTypes[0];
            } else {
                this.objectiveTypes = CONSTANTS.OBJECTIVES_TYPE;
                defaultType = _.findWhere(this.objectiveTypes, {_id: jsonModel.objectiveType});
            }

            this.objectivePriority = new FilterCollection(CONSTANTS.OBJECTIVES_PRIORITY, {parse: true});
            this.objectivePriority = this.objectivePriority.toJSON();
            defaultPriority = _.findWhere(this.objectivePriority, {_id: jsonModel.priority._id});

            populate.inputDropDown({
                selector    : '#typeDd',
                context     : this,
                contentType : 'type',
                displayModel: defaultType,
                collection  : this.objectiveTypes
            });

            this.renderStatus(jsonModel);

            populate.inputDropDown({
                selector    : '#priorityDd',
                context     : this,
                contentType : 'priority',
                displayModel: defaultPriority,
                collection  : this.objectivePriority
            });

            this.$el.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
                $element.editor.on('change', function (e) {
                    self.changeDesc(e);
                });
            });

            if (jsonModel.form) {
                this.showLinkedForm(jsonModel.form);
            }

            this.on('changeItem', this.changeItem);

            this.delegateEvents(this.events);

            return this;
        }
    });

    return EditView;
});
