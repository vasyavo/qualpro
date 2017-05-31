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
    'views/fileDialog/fileDialog',
    'async',
    'constants/contentType',
    'helpers/objectivesStatusHelper',
    'constants/errorMessages',
    'constants/aclRoleIndexes'
], function (Backbone, _, $, EditTemplate, FormTemplate, FileTemplate, BaseView, FileDialogView, Model,
             populate, LinkFormView, FilterCollection, FileCollection, FileModel, PersonnelListForSelectionView, TreeView,
             implementShowHideArabicInputIn, CONSTANTS, dataService, moment, VisibilityFromEditView,
             FileDialogPreviewView, async, CONTENT_TYPES, objectivesStatusHelper, ERROR_MESSAGES, ACL_ROLE_INDEXES) {

    var EditView = BaseView.extend({
        contentType: CONTENT_TYPES.OBJECTIVES,
        updateCount: 0,

        template             : _.template(EditTemplate),
        formTemplate         : _.template(FormTemplate),
        fileTemplate         : _.template(FileTemplate),
        ALLOWED_CONTENT_TYPES: _.union(
            CONSTANTS.IMAGE_CONTENT_TYPES,
            CONSTANTS.VIDEO_CONTENT_TYPES,
            CONSTANTS.MS_WORD_CONTENT_TYPES,
            CONSTANTS.MS_EXCEL_CONTENT_TYPES,
            CONSTANTS.MS_POWERPOINT_CONTENT_TYPES,
            CONSTANTS.OTHER_FORMATS
        ),

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
            'click #attachFile'          : 'showAttachDialog',
            'input #titleEn, #titleAr'   : 'changeTitle',
            'change #dateStart, #dateEnd': 'changeDate',
            'click #unlinkForm'          : 'showUnlinkPopUp',
            //events for duplicate
            'click #attachForm'          : 'showLinkFormDialog',
            'click #actionHolder:not(ul)': 'showHideActionDropdown',
            'click .formThumbnail'       : 'openForm',
            'click .fileThumbnailItem'   : 'showFilePreviewDialog',
            'click #downloadFile'        : 'stopPropagation',
            'click #personnelLocation'   : 'changePersonnelLocation',
        },

        initialize: function (options) {
            var self = this;
            var parent;

            options = options || {};

            this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
            this.anotherLanguage = this.currentLanguage === 'en' ? 'ar' : 'en';
            this.translation = options.translation;
            this.duplicate = options.duplicate;
            this.model = options.model.toJSON ? options.model : new Model(options.model, {parse: true});
            this.changed = {};

            var assigne = this.model.get('assignedTo')[0];

            this.assigneWithoutBranches = !assigne.branch.length;
            this.locations.location = this.model.get('location');

            var branches = this.model.get('branch') || [];
            var outlets = this.model.get('outlet') || [];
            this.outletsForVisibility = _.map(outlets, function (outlet) {
                let result = {
                    name : outlet.name[self.currentLanguage],
                    _id : outlet._id,
                    branches : []
                };

                branches.map((branch) => {
                    if (outlet._id === branch.outlet) {
                        result.branches.push({
                            name : branch.name[self.currentLanguage],
                            _id : branch._id
                        });
                    }
                });

                return result;
            });
            this.branchesForVisibility = _.uniq(branches, false, function (item) {
                return item._id;
            });

            parent = this.model.get('parent');
            this.parentObjectiveId = parent && parent[App.currentUser.accessRole.level - 1];
            if (this.duplicate) {
                this.model.unset('attachments');
            }
            this.attachments = _.pluck(this.model.get('attachments'), '_id');
            this.files = new FileCollection(this.model.get('attachments'), true);

            var form = this.model.get('form');

            if (form && form.contentType === CONSTANTS.OBJECTIVES_FORMS[1]._id) {
                this.linkedForm = CONSTANTS.OBJECTIVES_FORMS[1];
                this.linkedForm.formId = form._id;
            } else if (form && form.contentType === CONSTANTS.OBJECTIVES_FORMS[0]._id) {
                this.linkedForm = CONSTANTS.OBJECTIVES_FORMS[0];
                this.linkedForm.formId = form._id;
            }

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

        showFilePreviewDialog: _.debounce(function (e) {
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
        }, 1000, true),

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
            this.changed.formType = null;
            this.savedVisibilityModel = null;
            this.visibilityFormAjax = null;
            this.model.unset('form');
            $el.find('#formThumbnail').html('');
            $el.find('.formBlock').hide();
            this.showLinkForm();
        },

        openForm: _.debounce(function () {
            var self = this;
            var modelJSON = this.model.toJSON();

            if (modelJSON.status._id !== 'draft') {
                return;
            }

            var form = this.linkedForm;

            if (!form || !form._id) {
                return App.renderErrors([
                    ERROR_MESSAGES.nothingToShow[self.currentLanguage]
                ]);
            }

            var contentType = form._id;
            var description = {
                en: this.$el.find('.objectivesTextarea[data-property="en"]').val(),
                ar: this.$el.find('.objectivesTextarea[data-property="ar"]').val()
            };

            if (contentType === 'visibility' && modelJSON.createdBy.user._id === App.currentUser._id) {
                function showVF() {
                    self.editVisibilityFormView = new VisibilityFromEditView({
                        translation: self.translation,
                        description: description[self.currentLanguage] || description[self.anotherLanguage] || '',
                        locationString : self.locations.location,
                        outlets: self.outletsForVisibility,
                        withoutBranches: self.assigneWithoutBranches,
                        initialData: self.visibilityFormData ? self.visibilityFormData : null
                    });

                    self.editVisibilityFormView.on('save', function (data) {
                        self.visibilityFormData = data;
                        self.visibilityFormDataChanged = true;
                    });
                }

                if (this.visibilityFormData) {
                    showVF();
                } else {
                    dataService.getData('/form/visibility/' + form.formId, {}, function (err, response) {
                        if (err) {
                            return App.renderErrors([
                                ERROR_MESSAGES.visibilityFormNotLoaded[self.currentLanguage]
                            ]);
                        }
                        var resultFileObjects = [];

                        if (response.before.files.length) {
                            resultFileObjects = response.before.files.map(function (fileObj) {
                                return {
                                    _id: fileObj._id,
                                    fileName: fileObj.originalName,
                                    fileType: fileObj.contentType,
                                    base64: fileObj.url,
                                    uploaded: true,
                                    branchId: 'vfwithoutbranch'
                                };
                            });
                        } else if (response.branches.length) {
                            response.branches.forEach(function (item) {
                                item.before.files.forEach(function (fileObject) {
                                    resultFileObjects.push({
                                        uploaded: true,
                                        fileName: fileObject.originalName,
                                        base64: fileObject.url,
                                        fileType: fileObject.contentType,
                                        branchId: item.branchId,
                                        _id: fileObject._id
                                    });
                                });
                            });
                        }

                        if (resultFileObjects.length) {
                            self.visibilityFormData = {
                                files: resultFileObjects,
                                applyToAll: false,
                            }
                        }

                        showVF();
                    });
                }
            } else {
                App.render({
                    type   : 'alert',
                    message: ERROR_MESSAGES.youHaveNoRights[self.currentLanguage] + ' ' + self.linkedForm.name[self.currentLanguage] + ' ' + self.translation.form
                });
            }
        }, 1000, true),

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
                self.changed.formType = modelJSON._id;

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
            var val = moment($el.val(), 'DD.MM.YYYY');

            var value = val.toISOString();

            if (id === 'dateStart'){
                this.changed.dateStart = value;
                if (val.diff(moment(this.model.get('dateEnd'), 'DD.MM.YYYY')) > 0){
                    this.changed.dateEnd = value;
                }
            } else {
                this.changed.dateEnd = value;
            }
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
                    var newFiles = (context.visibilityFormData && context.visibilityFormData.files.length) ? context.visibilityFormData.files.filter(function (fileObj) {
                        return !fileObj.uploaded;
                    }) : [];

                    if (newFiles.length) {
                        var filesData = new FormData();

                        newFiles.forEach(function (fileObj, index) {
                            filesData.append(index, fileObj.file);
                        });

                        $.ajax({
                            url: '/file',
                            method: 'POST',
                            data: filesData,
                            contentType: false,
                            processData: false,
                            success: function (response) {
                                cb(null, model, response);
                            },
                            error: function () {
                                App.renderErrors([
                                    ERROR_MESSAGES.filesNotUploaded[currentLanguage]
                                ]);
                            }
                        });
                    } else {
                        cb(null, model, {
                            files: [],
                        });
                    }
                },

                function (model, uploadedFilesObject, cb) {
                    var visibilityFormRequestData = {
                        before: {
                            files: []
                        }
                    };
                    var visibilityFormDataFiles = context.visibilityFormData ? context.visibilityFormData.files : [];

                    if (uploadedFilesObject.files.length || visibilityFormDataFiles.length) {
                        if (context.assigneWithoutBranches) {
                            var arrayOfFileId = [];

                            context.visibilityFormData.files.forEach(function (item) {
                                if (item.uploaded) {
                                    arrayOfFileId.push(item._id);
                                }
                            });

                            uploadedFilesObject.files.forEach(function (item) {
                                arrayOfFileId.push(item._id);
                            });

                            visibilityFormRequestData = {
                                before: {
                                    files: arrayOfFileId
                                },
                                after: {
                                    files: [],
                                    description: ''
                                },
                                branches: []
                            };
                        } else if (context.visibilityFormData.applyToAll) {
                            var arrayOfFilesId = [];

                            context.visibilityFormData.files.forEach(function (item) {
                                if (item.uploaded) {
                                    arrayOfFilesId.push(item._id);
                                }
                            });

                            uploadedFilesObject.files.forEach(function (item) {
                                arrayOfFilesId.push(item._id);
                            });

                            visibilityFormRequestData = {
                                before: {
                                    files: []
                                },
                                after: {
                                    files: [],
                                    description: ''
                                },
                                branches: context.branchesForVisibility.map(function (item) {
                                    return {
                                        branchId: item._id,
                                        before: {
                                            files: arrayOfFilesId
                                        },
                                        after: {
                                            files: [],
                                            description: ''
                                        }
                                    };
                                })
                            };
                        } else {
                            visibilityFormRequestData = {
                                branches: context.visibilityFormData.files.map(function (item) {
                                    var arrayOfFilesDependsOnBranch = context.visibilityFormData.files.filter(function (fileObj) {
                                        return fileObj.branchId === item.branchId;
                                    });

                                    var arrayOfFileIds = arrayOfFilesDependsOnBranch.map(function (fileObj) {
                                        if (fileObj.uploaded) {
                                            return fileObj._id;
                                        }

                                        var searchedUploadedFile = uploadedFilesObject.files.find(function (obj) {
                                            return obj.originalName === fileObj.fileName;
                                        });

                                        return searchedUploadedFile._id;
                                    });

                                    return {
                                        branchId: item.branchId,
                                        before: {
                                            files: arrayOfFileIds
                                        },
                                        after: {
                                            files: [],
                                            description: ''
                                        }
                                    };
                                })
                            };
                        }
                    }

                    var form = model.get('form');

                    if (!form || !form._id || !form.contentType) {
                        return cb(null, model);
                    }

                    if (form.contentType !== 'visibility') {
                        return cb(null, model);
                    }

                    $.ajax({
                        url: '/form/visibility/before/' + form._id,
                        method: 'PUT',
                        contentType: 'application/json',
                        dataType: 'json',
                        data: JSON.stringify(visibilityFormRequestData),
                        success: function () {
                            cb(null, model);
                        },
                        error: function () {
                            cb(null, model);
                        }
                    });
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
            var self = this;

            locations.country = data.country;
            locations.region = data.region;
            locations.subRegion = data.subRegion;
            locations.retailSegment = data.retailSegment;
            locations.outlet = data.outlet;
            locations.branch = data.branch;
            this.locations.location = data.location;

            $personnelLocation.html(data.location);
            $personnelLocation.attr('data-location', data.location);

            this.changed.location = data.location;

            this.branchesForVisibility = _.filter(this.branchesForVisibility, function (branch) {
                return self.locations.branch.indexOf(branch._id) !== -1;
            });
            this.branchesForVisibility = _.uniq(this.branchesForVisibility, false, function (item) {
                return item._id;
            });

            this.outletsForVisibility = _.filter(this.outletsForVisibility, function (outlet) {
                return self.locations.outlet.indexOf(outlet._id) !== -1;
            });
            this.outletsForVisibility = _.uniq(this.outletsForVisibility, false, function (item) {
                return item._id;
            });
            this.outletsForVisibility = _.map(this.outletsForVisibility, function (outlet) {
                let result = {
                    name : outlet.name.currentLanguage,
                    _id : outlet._id,
                    branches : []
                };

                self.branchesForVisibility.map((branch) => {
                    if (outlet._id === branch.outlet) {
                        result.branches.push({
                            name : branch.name.currentLanguage,
                            _id : branch._id
                        });
                    }
                });

                return result;
            });

            this.unlinkForm();
        },

        showPersonnelView: function () {
            var personnelLocation = this.$el.find('#personnelLocation');
            var self = this;
            var creationsOptions = {
                withoutTabs       : true,
                parrentContentType: this.contentType,
                objectiveType     : this.changed.objectiveType || this.model.get('objectiveType'),
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

                self.branchesForVisibility = [];
                self.outletsForVisibility = [];

                jsonPersonnels.forEach(function (personnel) {
                    self.branchesForVisibility = self.branchesForVisibility.concat(personnel.branch);
                    self.outletsForVisibility = self.outletsForVisibility.concat(personnel.outlet);
                });

                if (jsonPersonnels.length && !self.linkedForm) {
                    if (App.currentUser.accessRole.level === 1 && self.changed.objectiveType !== 'individual' && self.model.get('objectiveType') !== 'individual') {
                        return;
                    }

                    self.showLinkForm();
                } else {
                    self.unlinkForm();
                }
            });
        },

        changePersonnelLocation: function () {
            var personnels = this.model.get('assignedTo');
            var personnelsIds = this.changed.assignedTo || _.pluck(personnels, '_id');
            var self = this;

            this.treeView = new TreeView({
                ids        : personnelsIds,
                translation: this.translation
            });

            this.treeView.on('locationSelected', this.locationSelected, this);

            if (!this.branchesForVisibility || (this.branchesForVisibility && !this.branchesForVisibility.length) ) {
                this.branchesForVisibility = [];

                personnels.forEach(function (personnel) {
                    self.branchesForVisibility = self.branchesForVisibility.concat(personnel.branch);
                });
            }

            if (!this.outletsForVisibility || (this.outletsForVisibility && !this.outletsForVisibility.length) ) {
                this.outletsForVisibility = [];

                personnels.forEach(function (personnel) {
                    self.outletsForVisibility = self.outletsForVisibility.concat(personnel.outlet);
                });
            }
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
            var currentLanguage = App.currentUser.currentLanguage;
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

            if (!Object.keys(this.changed).length && !this.updateCount && !this.visibilityFormDataChanged) {
                return cb();
            }

            this.model.setFieldsNames(this.translation, this.changed);
            this.model.validate(this.changed, function (err) {
                if (err && err.length) {
                    return App.renderErrors(err);
                }

                var objectiveType = self.changed.objectiveType || self.model.get('objectiveType');

                if (App.currentUser.accessRole.level === 2 && !self.linkedForm) {
                    return App.render({type: 'error', message: ERROR_MESSAGES.linkSomeForm[currentLanguage]});
                } else if (objectiveType === 'individual' && !self.linkedForm) {
                    return App.render({type: 'error', message: ERROR_MESSAGES.linkSomeForm[currentLanguage]});
                }

                if (self.changed.attachments) {
                    self.changed.attachments = _.compact(self.changed.attachments);
                    self.changed.attachments = self.changed.attachments.length ? self.changed.attachments : [];
                }

                if (self.linkedForm) {
                    self.changed.formType = self.linkedForm._id;
                }

                self.changed.saveObjective = options.save;

                self.$el.find('#mainForm').submit();
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
                jsonModel: jsonModel,
                linkedForm: this.linkedForm,
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
            $curEl.find('#assignDd').on('click', _.debounce(this.showPersonnelView.bind(this), 2000, true));

            startDateObj = {
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
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
