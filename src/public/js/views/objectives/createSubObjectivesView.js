define([
    'backbone',
    'Underscore',
    'jQuery',
    'text!templates/objectives/subObjective.html',
    'text!templates/file/preView.html',
    'text!templates/objectives/form/form.html',
    'collections/file/collection',
    'collections/filter/filterCollection',
    'collections/objectives/collection',
    'views/filter/treeView',
    'models/file',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'views/personnel/listForSelection',
    'helpers/implementShowHideArabicInputIn',
    'constants/otherConstants',
    'populate',
    'moment',
    'views/objectives/linkFormView',
    'views/objectives/visibilityForm/editView',
    'async',
    'views/fileDialog/fileDialog',
    'dataService',
    'constants/contentType',
    'models/objectives',
    'constants/errorMessages'
], function (Backbone, _, $, SubObjectiveTemplate, FileTemplate, FormTemplate,
             FileCollection, FilterCollection, ObjectiveCollection, TreeView, FileModel, BaseView,
             FileDialogView, PersonnelListForSelectionView,
             implementShowHideArabicInputIn, CONSTANTS, populate, moment, LinkFormView,
             VisibilityEditView, async, FileDialogPreviewView, dataService, CONTENT_TYPES, Model,
             ERROR_MESSAGES) {

    var SubObjectiveView = BaseView.extend({
        contentType: CONTENT_TYPES.OBJECTIVES,

        template             : _.template(SubObjectiveTemplate),
        fileTemplate         : _.template(FileTemplate),
        formTemplate         : _.template(FormTemplate),
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

        events: {
            'click #attachFile'          : 'showAttachDialog',
            'click #attachForm'          : 'showLinkFormDialog',
            'click #unlinkForm'          : 'showUnlinkPopUp',
            'click #actionHolder:not(ul)': 'showHideActionDropdown',
            'click #formThumbnail'       : 'openForm',
            'click .fileThumbnailItem'   : 'showFilePreviewDialog'
        },

        initialize: function (options) {
            var self = this;

            this.translation = options.translation;
            this.assign = options.assign;
            this.model = options.model;
            this.saveDataObject = {
                title   : this.model.get('title'),
                priority: this.model.get('priority')
            };
            this.model.unset('title', {silence: true});
            this.model.unset('priority', {silence: true});

            this.files = new FileCollection();
            this.multiselect = options.multiselect;
            this.assignDefFilter = options.assignDefFilter;
            this.assignOnAreaInchargeManager = this.assignDefFilter && this.assignDefFilter.assignLevel &&
                this.assignDefFilter.assignLevel.values && (this.assignDefFilter.assignLevel.values.indexOf(4) !== -1);
            this.assignedTo = [];
            this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';

            this.makeRender();

            dataService.getData(this.contentType + '/' + this.model.get('_id'), {}, function (err, response) {
                var files = response.attachments;

                if (err) {
                    return App.render({type: 'error', message: err.message});
                }

                self.files.setAndUpdateModels(files, false);
                self.render();
            });

            _.bindAll(this, 'fileSelected');
        },

        showFilePreviewDialog: _.debounce(function () {
            var currentLanguage = App.currentUser.currentLanguage;
            App.render({type: 'alert', message: ERROR_MESSAGES.fileIsNotUploaded[currentLanguage]});
        }, 1000, true),

        showLinkForm: function () {
            var $liEl = this.$el.find('#attachForm');

            $liEl.removeClass('hidden');
            this.hideUnlinkForm();
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

        showLinkFormDialog: function () {
            var self = this;
            var assignedToCount = self.assignedTo ? self.assignedTo.length : 0;

            this.linkFormView = new LinkFormView({
                assignedToCount: assignedToCount,
                translation    : self.translation
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

        unlinkForm: function () {
            var $el = this.$el;

            this.linkedForm = null;
            this.branchesForVisibility = [];
            this.outletsForVisibility = [];
            this.savedVisibilityModel = null;
            this.visibilityFormAjax = null;
            $el.find('#formThumbnail').html('');
            $el.find('.formBlock').hide();
            this.showLinkForm();
        },

        openForm: function () {
            var modelJSON = this.model.toJSON();
            var form;
            var contentType;
            var id;
            var description;
            var self = this;

            if (!this.assign || this.assignOnAreaInchargeManager) {
                return;
            }

            if (!(this.assignedTo && this.assignedTo.ids)) {
                return App.render({type: 'error', message: ERROR_MESSAGES.selectAssignee[self.currentLanguage]});
            }


            form = modelJSON.form;
            contentType = form.contentType;
            id = form._id;
            description = {
                en: this.$el.find('#descriptionEn').val(),
                ar: this.$el.find('#descriptionAr').val()
            };

            if (contentType === 'visibility' && (App.currentUser.accessRole.level === 3 || App.currentUser.accessRole.level === 4) && this.assignedTo.level > 4) {
                this.visibilityForm = new VisibilityEditView({
                    forCreate : true,
                    outlets : this.outletsForVisibility,
                    description : description,
                    savedVisibilityModel : this.savedVisibilityModel,
                    oldAjaxObj : this.visibilityFormAjax,
                    translation : self.translation
                });
                this.visibilityForm.on('visibilityFormEdit', function (ajaxObj) {
                    self.savedVisibilityModel = ajaxObj.model;
                    self.visibilityFormAjax = ajaxObj;
                });
            } else {
                App.render({
                    type   : 'alert',
                    message: ERROR_MESSAGES.youHaveNoRights[self.currentLanguage] + ' ' + self.linkedForm.name[self.currentLanguage] + ' ' + this.translation.form
                });
            }
        },

        formSubmit: function (e) {
            var context = e.data.context;
            var data = new FormData(this);
            var currentLanguage = App.currentUser.currentLanguage;

            e.preventDefault();

            if (!context.body.formType) {
                context.body.formType = context.linkedForm._id;
            }

            data.append('data', JSON.stringify(context.body));

            async.waterfall([
                function (cb) {
                    $.ajax({
                        url        : context.model.urlRoot() + '/subObjective',
                        type       : 'POST',
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
                    });

                },

                function (model, cb) {
                    var visibilityFormAjax = context.visibilityFormAjax;
                    var visibilityFormAjaxModel = null;
                    var files = null;

                    if (visibilityFormAjax) {
                        visibilityFormAjaxModel = visibilityFormAjax.model;
                    }

                    if (visibilityFormAjaxModel) {
                        files = visibilityFormAjaxModel.get('files');
                    }

                    if (files && files.length) {
                        $.ajax({
                            url : '/file',
                            method : 'POST',
                            data : context.visibilityFormAjax.data,
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
                        cb(null, model, {
                            files : []
                        });
                    }
                },

                function (model, files, cb) {
                    var form = model.get('form');
                    var formId;
                    var formType;

                    if (form) {
                        formId = form._id;
                        formType = form.contentType;
                    }

                    if (!context.visibilityFormAjax) {
                        if (form && formType === 'visibility') {
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
                            return;
                        } else {
                            return cb(null, model);
                        }
                    }

                    var requestPayload;

                    var branches = context.branchesForVisibility;
                    if (context.visibilityFormAjax && context.visibilityFormAjax.model.get('applyFileToAll')) {
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
                    } else {
                        var modelFiles = (context.visibilityFormAjax) ? context.visibilityFormAjax.model.get('files') || [] : [];
                        requestPayload = {
                            before: {
                                files: []
                            },
                            after: {
                                description: '',
                                files: []
                            },
                            branches: modelFiles.map(function (item) {
                                var fileFromServer = _.findWhere(files.files, {
                                    originalName: item.fileName
                                });

                                return {
                                    branchId: item.branch,
                                    before: {
                                        files: [fileFromServer._id]
                                    },
                                    after: {
                                        files: [],
                                        description: ''
                                    }
                                };
                            })
                        };
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

            ], function (err) {
                if (err) {
                    return App.render({type: 'error', message: ERROR_MESSAGES.objectiveNotSaved[currentLanguage]});
                }

                context.trigger('modelSaved');
            });
        },

        saveSubObjective: function (options, cb) {
            var self = this;
            var $curEl = this.$el;
            var currentLanguage = App.currentUser.currentLanguage;
            var dateStart = this.$el.find('#dateStart').val();
            var dateEnd = this.$el.find('#dateEnd').val();
            dateStart = dateStart ? moment(dateStart, 'DD.MM.YYYY, h:mm:ss').set('hour', 0).set('minute', 1).toISOString() : null;
            dateEnd = dateEnd ? moment(dateEnd, 'DD.MM.YYYY, h:mm:ss').set('hour', 23).set('minute', 59).toISOString() : null;
            this.checkForEmptyInput(this.files, this.$el);


            this.body = {
                title: {
                    en: this.$el.find('#titleEn').val(),
                    ar: this.$el.find('#titleAr').val()
                },

                parentId     : this.model.get('_id'),
                createdById  : this.model.get('createdBy').user._id,
                objectiveType: this.model.get('objectiveType'),
                assignedTo   : this.assignedTo.ids,
                priority     : $curEl.find('#priorityDd').attr('data-id'),
                dateStart    : dateStart,
                dateEnd      : dateEnd,
                saveObjective: !!options.save,
                attachments  : _.pluck(this.files.getParent({
                    parent: true,
                    models: this.files.getSelected({selected: true}),
                    json  : true
                }), '_id'),

                location   : this.$el.find('#personnelLocation').attr('data-location'),
                description: {
                    en: this.$el.find('.objectivesTextarea[data-property="en"]').val(),
                    ar: this.$el.find('.objectivesTextarea[data-property="ar"]').val()
                },

                country      : this.locations.country,
                region       : this.locations.region,
                subRegion    : this.locations.subRegion,
                retailSegment: this.locations.retailSegment,
                outlet       : this.locations.outlet,
                branch       : this.locations.branch
            };

            if (this.linkedForm && !this.dontLinkNewForm) {
                this.body.formType = this.linkedForm._id;
            }

            if (!this.assign) {
                if (!this.$el.find('#showCompanyObjective').prop('checked')) {
                    this.body.companyObjective = this.model.get('description');
                }
            } else {
                this.body.companyObjective = this.model.get('companyObjective');
            }

            this.model.setFieldsNames(this.translation);

            if (!this.linkedForm && App.currentUser.accessRole.level === 2) {
                return App.render({type: 'error', message: ERROR_MESSAGES.linkSomeForm[currentLanguage]});
            }

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    self.$el.find('#mainForm').submit();
                    cb();
                }
            });
        },

        locationSelected: function (data) {
            var self = this;

            this.locations.country = data.country;
            this.locations.region = data.region;
            this.locations.subRegion = data.subRegion;
            this.locations.retailSegment = data.retailSegment;
            this.locations.outlet = data.outlet;
            this.locations.branch = data.branch;

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

            this.$el.find('#personnelLocation').html(data.location);
            this.$el.find('#personnelLocation').attr('data-location', data.location);
        },

        showPersonnelView: function () {
            var personnelLocation = this.$el.find('#personnelLocation');
            var self = this;

            this.personnelListForSelectionView = new PersonnelListForSelectionView({
                multiselect       : self.multiselect,
                withoutTabs       : true,
                parrentContentType: this.contentType,
                defFilter         : this.assignDefFilter,
                translation       : this.translation
            });
            this.personnelListForSelectionView.on('coverSaved', function (personnelCollection) {
                var jsonPersonnels = personnelCollection.toJSON();
                var personnelsIds = _.pluck(jsonPersonnels, '_id');
                var personnelsNames = _.pluck(jsonPersonnels, 'fullName').join(', ');

                self.branchesForVisibility = [];
                self.outletsForVisibility = [];
                self.treeView = new TreeView({
                    ids        : personnelsIds,
                    translation: self.translation
                });
                self.treeView.on('locationSelected', self.locationSelected, self);
                self.$el.find('#assignDd').html(personnelsNames);

                self.assignedTo = {
                    ids  : personnelsIds,
                    level: jsonPersonnels[0].accessRole.level
                };

                jsonPersonnels.forEach(function (personnel) {
                    self.branchesForVisibility = self.branchesForVisibility.concat(personnel.branch);
                    self.outletsForVisibility = self.outletsForVisibility.concat(personnel.outlet);
                });

                if (self.assign) {
                    return;
                }

                if (jsonPersonnels.length && !self.linkedForm) {
                    self.showLinkForm();
                } else {
                    self.hideLinkForm();
                }

            });
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

                self.$el.find('#filesBlock').show();
                self.fileDialogView.trigger('fileSelected', fileModel);
                App.masonryGrid.call(self.$el);
            };

        },

        attachFile: function () {
            var fileInput;
            var fileModel = new FileModel();

            this.files.add(fileModel);
            this.$el.find('#mainForm').append('<input type="file" accept="' + this.ALLOWED_CONTENT_TYPES.join(', ') + '" name="' + fileModel.cid + '" id="' + fileModel.cid + '" style="display: none">');
            fileInput = this.$el.find('#' + fileModel.cid);
            fileInput.on('change', {fileInput: fileInput}, this.fileSelected);
            fileInput.click();
        },

        showAttachDialog: function () {
            this.fileDialogView = new FileDialogView({
                files      : this.files,
                haveParent : true,
                contentType: this.contentType,
                translation: this.translation,
                dialogTitle: this.translation.dialogTitle,
                buttonName : this.translation.attach
            });
            this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
            this.fileDialogView.on('addFile', this.addFile, this);
            this.fileDialogView.on('removeFile', this.removeFile, this);
        },

        removeFile: function (file) {
            var $curEl = this.$el;
            var $thumbnail = $curEl.find('.fileThumbnailItem[data-id = "' + (file.id || file.cid) + '"]');

            $thumbnail.remove();

            if (!file.get('uploaded')) {
                this.files.remove(file, {silent: true});
            }

            $curEl.find('#' + (file.id || file.cid)).remove();
        },

        addFile: function (file) {
            var $curEl = this.$el;

            $curEl.find('#fileThumbnail').append(this.fileTemplate({
                model: file.toJSON()
            }));

            $curEl.find('.filesBlock').show();
        },

        render: function () {
            var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
            var descriptionIdToHide = 'description' + anotherLanguage + 'Container';
            var titleIdToHide = 'title' + anotherLanguage;
            var currentLanguage = App.currentUser.currentLanguage;
            var jsonModel = this.model.toJSON();
            var formString;
            var self = this;
            var $curEl;
            var dateStart = moment(jsonModel.dateStart, 'DD.MM.YYYY');
            var dateEnd = moment(jsonModel.dateEnd, 'DD.MM.YYYY');

            var $startDate;
            var $dueDate;

            formString = this.template({
                objective    : jsonModel,
                assign       : this.assign,
                objectiveType: _.findWhere(CONSTANTS.OBJECTIVES_TYPE, {_id: jsonModel.objectiveType}).name[currentLanguage],
                translation  : this.translation
            });

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog  create-objective-dialog',
                title      : this.translation.titleCreateSub,
                width      : '1000',
                buttons    : {
                    save: {
                        text : self.translation.saveBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            var that = this;

                            self.saveSubObjective({save: true}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    },

                    send: {
                        text : self.translation.sendBtn,
                        class: 'btn sendBtn',
                        click: function () {
                            var that = this;

                            self.saveSubObjective({save: false}, function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    }
                }
            });

            if (jsonModel.form) {
                self.dontLinkNewForm = true;
                self.linkedForm = _.findWhere(CONSTANTS.OBJECTIVES_FORMS, {_id: jsonModel.form.contentType}) || {};

                self.$el.find('#formThumbnail').append(self.formTemplate({
                    name       : self.linkedForm.name[self.currentLanguage],
                    id         : self.linkedForm._id,
                    translation: self.translation
                }));

                self.$el.find('.formBlock').show();
            }

            $curEl = this.$el;

            $startDate = $curEl.find('#dateStart');
            $dueDate = $curEl.find('#dateEnd');

            $curEl.find('#' + descriptionIdToHide).hide();
            $curEl.find('#' + titleIdToHide).hide();
            $curEl.find('.filesBlock').hide();

            $curEl.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);
            $curEl.find('#assignDd').on('click', _.debounce(this.showPersonnelView.bind(this), 2000, true));

            $startDate.datepicker({
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: new Date(dateStart),
                onClose    : function (selectedDate) {
                    $dueDate.datepicker('option', 'minDate', selectedDate);
                }
            });

            $dueDate.datepicker({
                changeMonth: true,
                changeYear : true,
                yearRange  : '-20y:c+10y',
                minDate    : new Date(dateStart),
                maxDate    : new Date(dateEnd),
                defaultDate: new Date(dateEnd),
                onClose    : function (selectedDate) {
                    $startDate.datepicker('option', 'maxDate', selectedDate);
                }
            });

            implementShowHideArabicInputIn(this);

            this.objectivePriority = new FilterCollection(CONSTANTS.OBJECTIVES_PRIORITY, {parse: true});
            this.objectivePriority = this.objectivePriority.toJSON();

            populate.inputDropDown({
                selector    : '#priorityDd',
                context     : this,
                contentType : 'priority',
                displayModel: this.objectivePriority[1],
                collection  : this.objectivePriority
            });

            this.$el.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return SubObjectiveView;
});
