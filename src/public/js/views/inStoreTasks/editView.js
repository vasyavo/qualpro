define([
    'Backbone',
    'Underscore',
    'jQuery',
    'async',
    'text!templates/inStoreTasks/edit.html',
    'text!templates/objectives/form/form.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'models/inStoreTasks',
    'populate',
    'collections/filter/filterCollection',
    'collections/file/collection',
    'models/file',
    'views/personnel/listForSelection',
    'views/filter/treeView',
    'helpers/implementShowHideArabicInputIn',
    'constants/otherConstants',
    'dataService',
    'moment',
    'views/visibilityForm/editView',
    'views/fileDialog/fileDialog',
    'constants/contentType',
    'helpers/objectivesStatusHelper',
    'constants/errorMessages'
], function (Backbone, _, $, async, EditTemplate, FormTemplate, FileTemplate, BaseView, FileDialogView, Model,
             populate, FilterCollection, FileCollection, FileModel, PersonnelListForSelectionView, TreeView,
             implementShowHideArabicInputIn, CONSTANTS, dataService, moment, VisibilityEditView,
             FileDialogPreviewView, CONTENT_TYPES, objectivesStatusHelper, ERROR_MESSAGES) {

    var EditView = BaseView.extend({
        contentType          : CONTENT_TYPES.INSTORETASKS,
        updateCount          : 0,
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

        events: {
            'click #assignDd'            : 'showPersonnelView',
            'click #attachFile'          : 'showAttachDialog',
            'input #title, #titleAr'     : 'changeTitle',
            'change #dateStart, #dateEnd': 'changeDate',
            'click #attachForm'          : 'linkVisibilityForm',
            'click #actionHolder:not(ul)': 'showHideActionDropdown',
            'click .formThumbnail'       : 'openForm',
            'click .fileThumbnailItem'   : 'showFilePreviewDialog',
            'click #downloadFile'        : 'stopPropagation'
        },

        initialize: function (options) {
            options = options || {};

            this.body = {};
            this.translation = options.translation;
            this.duplicate = options.duplicate;
            this.model = options.model.toJSON ? options.model : new Model(options.model, {parse: true});
            this.attachments = _.pluck(this.model.get('attachments'), '_id');
            this.files = new FileCollection(this.model.get('attachments'));
            this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';

            this.makeRender();
            this.render();

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

        onDuplicate: function (options) {
            var self = this;
            var $curEl = this.$el;
            var startDate = $curEl.find('#dateStart').val();
            var endDate = $curEl.find('#dateEnd').val();
            startDate = startDate ? moment(startDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 0).set('minute', 1).toISOString() : null;
            endDate = endDate ? moment(endDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 23).set('minute', 59).toISOString() : null;
            this.checkForEmptyInput(this.files, this.$el);

            this.body = {
                title: {
                    en: $curEl.find('#title').val(),
                    ar: $curEl.find('#titleAr').val()
                },

                objectiveType: $curEl.find('#typeDd').attr('data-id'),
                assignedTo   : this.body.assignedTo,
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
                this.body.formType = this.linkedForm._id;
            }

            this.model.setFieldsNames(this.translation);

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    self.$el.find('#mainForm').submit();
                }
            });
        },

        openForm: function () {
            var modelJSON = this.model.toJSON();
            var self = this;
            var visibilityFormOptions;
            var description;
            var form;
            var id;

            if (!this.duplicate) {
                form = modelJSON.form;
                id = form._id;
            }

            if (modelJSON.createdBy.user._id === App.currentUser._id) {
                description = {
                    en: this.$el.find('.objectivesTextarea[data-property="en"]').val(),
                    ar: this.$el.find('.objectivesTextarea[data-property="ar"]').val()
                };

                if (!this.duplicate) {
                    this.branchesForVisibility = modelJSON.branch;
                    this.branchesForVisibility = _.map(this.branchesForVisibility, function (branch) {
                        return branch.name.currentLanguage;
                    });
                }
                visibilityFormOptions = {
                    branchName          : this.branchesForVisibility.join(', '),
                    description         : description,
                    savedVisibilityModel: this.savedVisibilityModel,
                    oldAjaxObj          : this.visibilityFormAjax,
                    translation         : self.translation
                };

                if (!this.duplicate) {
                    visibilityFormOptions.id = id;
                }


                this.visibilityForm = new VisibilityEditView(visibilityFormOptions);
                this.visibilityForm.on('visibilityFormEdit', function (ajaxObj) {
                    self.visibilityFormAjax = ajaxObj;
                    self.savedVisibilityModel = ajaxObj.model;
                });
            }
        },

        hideLinkForm: function () {
            var $liEl = this.$el.find('#attachForm');

            $liEl.addClass('hidden');
        },

        showLinkForm: function () {
            var $liEl = this.$el.find('#attachForm');

            $liEl.removeClass('hidden');
        },

        linkVisibilityForm: function () {
            var self = this;

            this.linkedForm = CONSTANTS.OBJECTIVES_FORMS[1];

            this.$el.find('#objectiveFormThumbnail').append(this.formTemplate({
                name       : self.linkedForm.name[this.currentLanguage],
                id         : self.linkedForm._id,
                translation: this.translation
            }));

            this.$el.find('.formBlock').show();
            this.hideLinkForm();
        },

        changeDate: function (e) {
            var $el = $(e.target);
            var id = $el.attr('id');
            var val = $el.val();

            val = moment(val, 'DD.MM.YYYY').toISOString();

            id === 'dataStart' ? this.body.dateStart = val : this.body.dateEnd = val;
        },

        changeDesc: function (e) {
            var jsonModel = this.model.toJSON();
            var $editor = e.editor;
            var name = $editor.name;
            var val = $editor.getData();

            this.body.description = jsonModel.description || {};
            name === 'descriptionEn' ? this.body.description.en = val : this.body.description.ar = val;
        },

        changeTitle: function (e) {
            var jsonModel = this.model.toJSON();
            var $el = $(e.target);
            var id = $el.attr('id');
            var val = $el.val();

            this.body.title = jsonModel.title || {};
            id === 'titleEn' ? this.body.title.en = val : this.body.title.ar = val;
        },

        changeItem: function (data) {
            var id = data.$selector.attr('id');
            var itemId = data.model._id;
            if (id === 'statusDd') {
                this.body.status = itemId;
            } else if (id === 'priorityDd') {
                this.body.priority = itemId;
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

                    if (context.body.assignedTo && context.body.assignedTo.length === 0) {
                        return App.render({type: 'error', message: ERROR_MESSAGES.selectPersonnel[currentLanguage]});
                    }

                    if (!context.duplicate) {
                        data.append('data', JSON.stringify({
                            changed    : context.body,
                            attachments: context.attachments
                        }));
                        ajaxData.type = 'PUT';
                    } else {
                        data.append('data', JSON.stringify(context.body));
                        ajaxData.type = 'POST';
                    }

                    $.ajax(ajaxData);

                },

                function (model, cb) {
                    var visibilityFormAjax = context.visibilityFormAjax;
                    var VFData = null;
                    var file = null;

                    if (visibilityFormAjax) {
                        VFData = context.visibilityFormAjax.data;
                    }

                    if (VFData) {
                        file = context.visibilityFormAjax.data.get('inputBefore');
                    }

                    if (file) {
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
                        cb(null, model, {
                            files : []
                        });
                    }
                },

                function (model, files, cb) {
                    var formId = model.get('form')._id;

                    if (!context.visibilityFormAjax) {
                        return cb(null, model);
                    }

                    context.visibilityFormAjax.success = function () {
                        cb(null, model);
                    };

                    context.visibilityFormAjax.error = function () {
                        cb(true);
                    };

                    delete context.visibilityFormAjax.model;

                    context.visibilityFormAjax.url = 'form/visibility/before/' + formId;
                    context.visibilityFormAjax.contentType = 'application/json';
                    context.visibilityFormAjax.dataType = 'json';

                    context.visibilityFormAjax.data = JSON.stringify({
                        before : {
                            files : files.files.map(function (item) {
                                return item._id;
                            })
                        }
                    });

                    $.ajax(context.visibilityFormAjax);
                }
            ], function (err, model) {
                if (err) {
                    return App.render({type: 'error', message: ERROR_MESSAGES.inStoreNotSaved[currentLanguage]});
                }

                context.trigger('modelSaved', model);
                context.$el.dialog('close').dialog('destroy').remove();
            });
        },

        showAttachDialog: function () {
            if (this.model.get('level') > 1) {
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
                    contentType: this.contentType,
                    translation: this.translation,
                    dialogTitle: this.translation.dialogTitle,
                    buttonName : this.translation.attach
                });
            }

            this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
            this.fileDialogView.on('removeFile', this.removeFile, this);
            this.fileDialogView.on('addFile', this.addFile, this);
        },

        removeFile: function (file) {
            var fileId = file.get('_id') || file.cid;
            var $thumbnail = this.$el.find('.fileThumbnailItem[data-id = "' + fileId + '"]');

            $thumbnail.remove();
            --this.updateCount;

            this.attachments = _.without(this.attachments, fileId);
            if (!file.uploaded) {
                this.files.remove(file, {silent: true});
                this.$el.find('#' + file.cid).remove();
            } else {
                dataService.deleteData(file.url, {
                    fileId     : fileId,
                    objectiveId: this.model.get('_id')
                }, function (err, xhr) {
                    if (err) {
                        App.render(err);
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

            this.$el.find('#filesBlock').show();
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
                var model;
                var type;
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
            this.$el.find('#mainForm').append('<input accept="' + this.ALLOWED_CONTENT_TYPES.join(', ') + '" type="file" name="' + fileModel.cid + '" id="' + fileModel.cid + '" style="display: none">');
            fileInput = this.$el.find('#' + fileModel.cid);
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

            this.body.location = data.location;
        },

        showPersonnelView: function () {
            var personnelLocation = this.$el.find('#personnelLocation');
            var self = this;

            this.personnelListForSelectionView = new PersonnelListForSelectionView({
                multiselect       : false,
                withoutTabs       : true,
                parrentContentType: this.contentType,
                notCheckFilters   : true
            });

            this.personnelListForSelectionView.on('coverSaved', function (personnelCollection) {
                var jsonPersonnels = personnelCollection.toJSON();
                var personnelsIds = _.pluck(jsonPersonnels, '_id');
                var personnelsNames = _.pluck(jsonPersonnels, 'fullName').join(', ');
                var collectionJSON = personnelCollection.toJSON();
                var isTradeMarketer = collectionJSON.length === 1 && (collectionJSON[0].accessRole.level === 10 || collectionJSON[0].accessRole.level === 1);

                if (!isTradeMarketer){
                    self.treeView = new TreeView({
                        ids             : personnelsIds,
                        instoreObjective: true,
                        selectedLevel   : jsonPersonnels[0].accessRole.level,
                        translation     : self.translation
                    });
                    self.treeView.on('locationSelected', self.locationSelected, self);
                } else {
                    self.$el.find('#personnelLocation').attr('data-location', 'empty');
                }

                self.$el.find('#assignDd').html(personnelsNames);

                if (self.duplicate) {
                    self.branchesForVisibility = [];
                    jsonPersonnels.forEach(function (personnel) {
                        self.branchesForVisibility = self.branchesForVisibility.concat(personnel.branch);
                    });
                }
                self.body.assignedTo = personnelsIds;


                if (jsonPersonnels.length && !self.linkedForm) {
                    self.showLinkForm();
                } else {
                    self.hideLinkForm();
                }
            });
        },

        showLinkedForm: function (form) {

            this.$el.find('#objectiveFormThumbnail').append(this.formTemplate({
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
            var selectedFiles;
            var attachments;
            var files;
            var change;
            this.checkForEmptyInput(this.files, this.$el);

            files = this.files.toJSON();
            attachments = _.pluck(model.attachments, '_id');
            selectedFiles = _.where(files, {selected: true});
            selectedFiles = _.pluck(selectedFiles, '_id');

            if (selectedFiles.length) {
                change = _.difference(selectedFiles, attachments);
                if (change.length || selectedFiles.length !== attachments.length) {
                    this.body.attachments = selectedFiles;
                } else {
                    this.updateCount = null;
                }
            } else {
                this.attachments = [];
            }

            if (!Object.keys(this.body).length && !this.updateCount && !this.visibilityFormAjax) {
                return cb();
            }

            this.model.setFieldsNames(this.translation, this.body);

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    if (self.body.attachments) {
                        self.body.attachments = _.compact(self.body.attachments);
                        self.body.attachments = self.body.attachments.length ? self.body.attachments : [];
                    }

                    self.body.saveObjective = options.save;

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
                    if (createdByMe) {
                        statusToRemove = STATUSES.COMPLETED;
                    } else {
                        statusToRemove = STATUSES.FAIL;
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
            var defaultDateEnd = jsonModel.dateEnd ? moment(jsonModel.dateEnd, 'DD.MM.YYYY').toDate() : new Date(dateEnd);
            var formString;
            var defaultPriority;
            var self = this;
            var dateStart = new Date();
            var dateEnd;
            var $startDate;
            var $endDate;
            var startDateObj;
            var endDateObj;
            var $curEl;
            var buttons;

            jsonModel.duplicate = this.duplicate;
            formString = this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            });

            buttons = {
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

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog',
                width      : '1000',
                buttons    : buttons
            });

            $curEl = this.$el;

            $curEl.find('#' + descriptionIdToHide).hide();
            $curEl.find('#' + titleIdToHide).hide();
            $curEl.find('#filesBlock').hide();

            $startDate = $curEl.find('#dateStart');
            $endDate = $curEl.find('#dateEnd');

            $curEl.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);

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
                defaultDate: defaultDateEnd,
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

            this.objectivePriority = new FilterCollection(CONSTANTS.OBJECTIVES_PRIORITY, {parse: true});
            this.objectivePriority = this.objectivePriority.toJSON();
            defaultPriority = _.findWhere(this.objectivePriority, {_id: jsonModel.priority._id});

            this.renderStatus(jsonModel);

            populate.inputDropDown({
                selector    : '#priorityDd',
                context     : this,
                contentType : CONTENT_TYPES.PRIORITY,
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

            if (!this.duplicate) {
                this.setSelectedFiles(jsonModel.attachments);
            }

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

