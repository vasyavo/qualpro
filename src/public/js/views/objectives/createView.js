var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var lodash = require('lodash');
var moment = require('moment');
var async = require('async');
var CreateTemplate = require('../../../templates/objectives/create.html');
var FormTemplate = require('../../../templates/objectives/form/form.html');
var FileTemplate = require('../../../templates/file/preView.html');
var BaseView = require('../../views/baseDialog');
var FileDialogView = require('../../views/objectives/fileDialogView');
var LinkFormView = require('../../views/objectives/linkFormView');
var PersonnelListForSelectionView = require('../../views/personnel/listForSelection');
var TreeView = require('../../views/filter/treeView');
var Model = require('../../models/objectives');
var populate = require('../../populate');
var FilterCollection = require('../../collections/filter/filterCollection');
var FileCollection = require('../../collections/file/collection');
var FileModel = require('../../models/file');
var implementShowHideArabicInputIn = require('../../helpers/implementShowHideArabicInputIn');
var VisibilityFormEditView = require('../../views/objectives/visibilityForm/editView');
var CONSTANTS = require('../../constants/otherConstants');
var CONTENT_TYPES = require('../../constants/contentType');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var App = require('../../appState');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.OBJECTIVES,

    template             : _.template(CreateTemplate),
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

    imageSrc: '',

    events: {
        'click #attachFile'          : 'showAttachDialog',
        'click #attachForm'          : 'showLinkFormDialog',
        'click #unlinkForm'          : 'showUnlinkPopUp',
        'click #actionHolder:not(ul)': 'showHideActionDropdown',
        'click #formThumbnail'       : 'openForm',
        'click .fileThumbnailItem'   : 'showFilePreviewDialog'
    },

    initialize: function (options) {
        this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
        this.translation = options.translation;
        this.files = new FileCollection();
        this.model = new Model();
        this.makeRender();
        this.render();

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
        var form;
        var description;
        var self = this;
        var $curEl = this.$el;

        if (this.objectiveType !== 'individual' && this.objectiveType !== 'country') {
            return;
        }

        form = self.linkedForm;

        if (form._id !== 'visibility') {
            return;
        }

        description = {
            en: _.unescape($curEl.find('.objectivesTextarea[data-property="en"]').val()),
            ar: _.unescape($curEl.find('.objectivesTextarea[data-property="ar"]').val())
        };

        this.visibilityForm = new VisibilityFormEditView({
            translation : self.translation,
            description : description[App.currentUser.currentLanguage],
            locationString : self.locations.location,
            outlets: this.outletsForVisibility,
            withoutBranches: !this.outletsForVisibility.length,
            initialData: this.visibilityFormData ? this.visibilityFormData : null
        });

        this.visibilityForm.on('save', function (data) {
            self.visibilityFormData = data;
        });
    },

    saveObjective: function (options, cb) {
        var self = this;
        var $curEl = this.$el;
        var currentLanguage = App.currentUser.currentLanguage;
        var startDate = $curEl.find('#dateStart').val();
        var endDate = $curEl.find('#dateEnd').val();
        startDate = startDate ? moment(startDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 0).set('minute', 1).toISOString() : null;
        endDate = endDate ? moment(endDate, 'DD.MM.YYYY, h:mm:ss').set('hour', 23).set('minute', 59).toISOString() : null;
        this.checkForEmptyInput(this.files, this.$el);

        this.body = {
            title: {
                en: $curEl.find('#titleEn').val(),
                ar: $curEl.find('#titleAr').val()
            },

            objectiveType: this.objectiveType,
            assignedTo   : _.pluck(this.assignedTo, '_id'),
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
                if (App.currentUser.accessRole.level === 2 && !self.linkedForm) {
                    return App.render({type: 'error', message: ERROR_MESSAGES.linkSomeForm[currentLanguage]});
                } else if (self.body.objectiveType === 'individual' && !self.linkedForm) {
                    return App.render({type: 'error', message: ERROR_MESSAGES.linkSomeForm[currentLanguage]});
                }
                self.$el.find('#mainForm').submit();
                cb();
            }
        });
    },

    formSubmit: function (e) {
        var context = e.data.context;
        var currentLanguage = App.currentUser.currentLanguage;

        e.preventDefault();

        async.waterfall([
            function (cb) {
                var data = new FormData(this);

                data.append('data', JSON.stringify(context.body));

                $.ajax({
                    url: context.model.urlRoot(),
                    type: 'POST',
                    data: data,
                    contentType: false,
                    processData: false,
                    success: function (xhr) {
                        var model = new Model(xhr, {parse: true});

                        cb(null, model);
                    },
                    error: function () {
                        cb(true);
                    }
                });
            },

            function (model, cb) {
                if (context.visibilityFormData && context.visibilityFormData.files.length) {
                    var filesData = new FormData();

                    context.visibilityFormData.files.forEach(function (fileObj, index) {
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
                var arrayOfUploadedFilesId = uploadedFilesObject.files.map(function (item) {
                    return item._id;
                });

                if (uploadedFilesObject.files.length) {
                    if (context.assigneWithoutBranches) {
                        visibilityFormRequestData = {
                            before: {
                                files: arrayOfUploadedFilesId
                            }
                        };
                    } else if (context.visibilityFormData.applyToAll) {
                        visibilityFormRequestData = {
                            branches: context.branchesForVisibility.map(function (item) {
                                return {
                                    branchId: item._id,
                                    before: {
                                        files: arrayOfUploadedFilesId
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
                                var files = [];

                                var arrayOfFilesDependsOnBranch = context.visibilityFormData.files.filter(function (fileObj) {
                                    return fileObj.branchId === item.branchId;
                                });

                                var arrayOfFileIds = arrayOfFilesDependsOnBranch.map(function (fileObj) {
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
                    url: 'form/visibility/before/' + form._id,
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
            },

        ], function (err, model) {
            if (err) {
                return App.render({type: 'error', message: ERROR_MESSAGES.objectiveNotSaved[currentLanguage]});
            }

            context.trigger('modelSaved', model);
        });
    },

    showAttachDialog: function () {
        this.fileDialogView = new FileDialogView({
            files      : this.files,
            contentType: this.contentType,
            translation: this.translation,
            dialogTitle: this.translation.dialogTitle,
            buttonName : this.translation.attach
        });
        this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
        this.fileDialogView.on('removeFile', this.removeFile, this);
    },

    showLinkFormDialog: function () {
        var self = this;
        var assignedToCount = self.assignedTo ? self.assignedTo.length : 0;

        this.linkFormView = new LinkFormView({
            assignedToCount         : assignedToCount,
            individual              : (self.objectiveType === 'individual'),
            dontShowDistributionForm: this.dontShowDistributionForm,
            translation             : this.translation
        });

        this.linkFormView.on('formLinked', function (modelJSON) {
            self.linkedForm = modelJSON;

            // bandage: AM to AinM choose visibility form and publish objective without open form
            if (modelJSON._id === 'visibility') {
                self.visibilityFormAjax = {
                    model: new Backbone.Model(Object.assign({}, modelJSON, { files: [] }))
                };
            }
            // bandage: end

            self.$el.find('#formThumbnail').append(self.formTemplate({
                name       : modelJSON.name[self.currentLanguage],
                id         : modelJSON._id,
                translation: self.translation
            }));

            self.$el.find('.formBlock').show();
            self.hideLinkForm();
        });
    },

    removeFile: function (file) {
        var $thumbnail = this.$el.find('.fileThumbnailItem[data-id = "' + file.cid + '"]');

        $thumbnail.remove();
        this.files.remove(file, {silent: true});
        this.$el.find('#' + file.cid).remove();
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

            self.$el.find('.filesBlock').show();
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
        var self = this;

        this.locations.country = data.country;
        this.locations.region = data.region;
        this.locations.subRegion = data.subRegion;
        this.locations.retailSegment = data.retailSegment;
        this.locations.outlet = data.outlet;
        this.locations.branch = data.branch;
        this.locations.location = data.location;

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
            var result = {
                name : outlet.name.currentLanguage,
                _id : outlet._id,
                branches : []
            };

            self.branchesForVisibility.map(function(branch) {
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
        var creationOptions = {
            multiselect       : false,
            withoutTabs       : true,
            parrentContentType: this.contentType,
            objectiveType     : this.objectiveType,
            translation       : this.translation.assignToPersonnel
        };

        if (this.objectiveType === 'individual') {
            creationOptions.multiselect = false;
        }

        this.personnelListForSelectionView = new PersonnelListForSelectionView(creationOptions);

        this.personnelListForSelectionView.on('coverSaved', function (personnelCollection) {
            var jsonPersonnels = personnelCollection.toJSON();
            var personnelsIds = _.pluck(jsonPersonnels, '_id');
            var personnelsNames = _.pluck(jsonPersonnels, 'fullName').join(', ');
            var smCvMzLevels = [5, 6, 7];

            self.assigneWithoutBranches = !jsonPersonnels[0].branch.length;

            self.branchesForVisibility = [];
            self.outletsForVisibility = [];
            self.dontShowDistributionForm = smCvMzLevels.indexOf(jsonPersonnels[0].accessRole.level) === -1;
            self.treeView = new TreeView({
                ids        : personnelsIds,
                translation: self.translation
            });
            self.treeView.on('locationSelected', self.locationSelected, self);
            self.$el.find('#assignDd').html(personnelsNames);
            self.assignedTo = jsonPersonnels;

            jsonPersonnels.forEach(function (personnel) {
                self.branchesForVisibility = self.branchesForVisibility.concat(personnel.branch);
                self.outletsForVisibility = self.outletsForVisibility.concat(personnel.outlet);
            });

            if (jsonPersonnels.length && !self.linkedForm) {
                if (App.currentUser.accessRole.level === 1 && self.objectiveType !== 'individual') {
                    return;
                }

                self.showLinkForm();
            } else {
                self.hideLinkForm();
            }
        });
    },

    changeObjectiveType: function (opts) {
        var $curEl = this.$el;

        if (opts.$selector.attr('id') === 'typeDd') {
            this.assignedTo = null;
            $curEl.find('#personnelLocation').html('');
            $curEl.find('#personnelLocation').attr('data-location', '');

            $curEl.find('#assignDd').html('Select personnel');

            this.unlinkForm();
            this.hideLinkForm();
            this.hideUnlinkForm();

            this.objectiveType = opts.model._id;
        }
    },

    render: function () {
        var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'Ar' : 'En';
        var descriptionIdToHide = 'description' + anotherLanguage + 'Container';
        var titleIdToHide = 'title' + anotherLanguage;
        var jsonModel = this.model.toJSON();
        var formString = this.template({
            jsonModel  : jsonModel,
            translation: this.translation,
            App: App,
        });
        var self = this;
        var dateStart = new Date();
        var $startDate;
        var $endDate;
        var $curEl;

        this.$el = $(formString).dialog({
            dialogClass: 'create-dialog full-height-dialog',
            title      : 'Create New Objective',
            width      : '1000',
            buttons    : {
                save: {
                    text : self.translation.saveBtn,
                    class: 'btn saveBtn',
                    click: function () {
                        var that = this;

                        self.saveObjective({save: true}, function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                },

                send: {
                    text : self.translation.sendBtn,
                    class: 'btn sendBtn',
                    click: function () {
                        var that = this;

                        self.saveObjective({save: false}, function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                }
            }
        });

        $curEl = this.$el;

        $curEl.find('#' + descriptionIdToHide).hide();
        $curEl.find('#' + titleIdToHide).hide();
        $curEl.find('.filesBlock').hide();
        $curEl.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);
        $curEl.find('#assignDd').on('click', _.debounce(this.showPersonnelView.bind(this), 2000, true));

        $startDate = $curEl.find('#dateStart');
        $endDate = $curEl.find('#dateEnd');

        $startDate.datepicker({
            changeMonth: true,
            changeYear : true,
            yearRange  : '-20y:c+10y',
            minDate    : new Date(dateStart),
            defaultDate: new Date(dateStart),
            onClose    : function (selectedDate) {
                $endDate.datepicker('option', 'minDate', selectedDate);
            }
        });

        $endDate.datepicker({
            changeMonth: true,
            changeYear : true,
            yearRange  : '-20y:c+10y',
            minDate    : new Date(dateStart),
            onClose    : function (selectedDate) {
                $startDate.datepicker('option', 'maxDate', selectedDate);
            }
        });

        implementShowHideArabicInputIn(this);

        if (App.currentUser.accessRole.level === 2) {
            this.objectiveTypes = CONSTANTS.OBJECTIVES_TYPE.slice(-2);
        } else if (App.currentUser.accessRole.level > 1) {
            this.objectiveTypes = [CONSTANTS.OBJECTIVES_TYPE[4]];
        } else {
            this.objectiveTypes = CONSTANTS.OBJECTIVES_TYPE.slice(0, 5);
        }

        populate.inputDropDown({
            selector    : '#typeDd',
            context     : this,
            contentType : 'type',
            displayModel: this.objectiveTypes[0],
            collection  : this.objectiveTypes
        });

        this.objectiveType = this.objectiveTypes[0]._id;

        this.on('changeItem', this.changeObjectiveType, this);

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
