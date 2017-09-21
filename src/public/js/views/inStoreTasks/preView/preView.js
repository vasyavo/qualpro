var $ = require('jquery');
var _ = require('underscore');
var lodash = require('lodash');
var async = require('async');
var PreviewTemplate = require('../../../../templates/inStoreTasks/preview.html');
var FormTemplate = require('../../../../templates/inStoreTasks/form/form.html');
var FileTemplate = require('../../../../templates/file/preView.html');
var CommentTemplate = require('../../../../templates/inStoreTasks/comments/comment.html');
var NewCommentTemplate = require('../../../../templates/inStoreTasks/comments/newRow.html');
var FileCollection = require('../../../collections/file/collection');
var FileModel = require('../../../models/file');
var CommentModel = require('../../../models/comment');
var TaskFlowModel = require('../../../models/taskFlow');
var BaseView = require('../../../views/baseDialog');
var FileDialogView = require('../../../views/objectives/fileDialogView');
var CommentCollection = require('../../../collections/comment/collection');
var populate = require('../../../populate');
var CONSTANTS = require('../../../constants/otherConstants');
var levelConfig = require('../../../constants/levelConfig');
var implementShowHideArabicInputIn = require('../../../helpers/implementShowHideArabicInputIn');
var dataService = require('../../../dataService');
var VisibilityForm = require('../../../views/objectives/visibilityForm/overview');
var UpdatedPreview = require('../../../../templates/inStoreTasks/updatedPreview.html');
var TaskFlowTemplate = require('../../../../templates/inStoreTasks/taskFlowTemplate.html');
var Model = require('../../../models/inStoreTasks');
var TreeView = require('../../../views/filter/treeView');
var PersonnelListForSelectionView = require('../../../views/personnel/listForSelection');
var FileDialogPreviewView = require('../../../views/fileDialog/fileDialog');
var CONTENT_TYPES = require('../../../constants/contentType');
var objectivesStatusHelper = require('../../../helpers/objectivesStatusHelper');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var App = require('../../../appState');
var CONTROLS_CONFIG = levelConfig[CONTENT_TYPES.INSTORETASKS];
var modules = require('../../../requiredModules');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.INSTORETASKS,

    template          : _.template(PreviewTemplate),
    commentTemplate   : _.template(CommentTemplate),
    newCommentTemplate: _.template(NewCommentTemplate),
    formTemplate      : _.template(FormTemplate),
    fileTemplate      : _.template(FileTemplate),
    updatedTemplate   : _.template(UpdatedPreview),
    taskFlow          : _.template(TaskFlowTemplate),
    dontShowDialog    : false,
    locations         : {
        country      : [],
        region       : [],
        subRegion    : [],
        retailSegment: [],
        outlet       : [],
        branch       : []
    },

    changed              : {},
    ALLOWED_CONTENT_TYPES: _.union(
        CONSTANTS.IMAGE_CONTENT_TYPES,
        CONSTANTS.VIDEO_CONTENT_TYPES,
        CONSTANTS.MS_WORD_CONTENT_TYPES,
        CONSTANTS.MS_EXCEL_CONTENT_TYPES,
        CONSTANTS.MS_POWERPOINT_CONTENT_TYPES,
        CONSTANTS.OTHER_FORMATS
    ),

    events: {
        'click #sendComment'              : 'sendComment',
        'click #attachFiles'              : 'showAttachDialog',
        'click #assign'                   : 'showPersonnelView',
        'click #edit'                     : 'editInStoreTask',
        'click .formThumbnail'            : 'openForm',
        'click #duplicate'                : 'duplicateInStoreTask',
        'click .commentBottom .attachment': 'onShowFilesInComment',
        'click #showAllDescription'       : 'onshowAllDescriptionInComment',
        'click .fileThumbnailItem'        : 'showFilePreviewDialog',
        'click #goToBtn'                  : 'goTo'
    },

    initialize: function (options) {
        var self = this;

        this.tabName = options.tabName;
        this.translation = options.translation;
        this.activityList = options.activityList;
        this.model = options.model.toJSON() ? options.model : new Model(options.model, {parse: true});
        if (this.activityList) {
            this.model = new Model(options.model.toJSON(), {merge: true, parse: false});
        }
        this.changed = {};
        this.files = new FileCollection();
        this.previewFiles = new FileCollection(this.model.get('attachments'), true);
        this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
        _.bindAll(this, 'fileSelected', 'renderComment');

        if (!this.activityList) {
            this.modelForFlow = new TaskFlowModel({
                _id: this.model.get('_id')
            });

            this.modelForFlow.fetch();

            this.modelForFlow.on('sync', function () {
                self.makeRender();
                self.render();
            });
        } else {
            this.modelForFlow = this.model;
            self.makeRender();
            self.render();
        }

        dataService.getData('/form/visibility/' + this.model.get('form')._id, {}, function (err, response) {
            if (response.after.description) {
                self.afterPartFilled = true;
            }
        });

        this.on('updatePreview', function (model) {
            self.model = model;
            self.dontShowDialog = true;
            self.render();
        });

    },

    showFilePreviewDialog: _.debounce(function (e) {
        var $el = $(e.target);
        var $thumbnail = $el.closest('.masonryThumbnail');
        var fileModelId = $thumbnail.attr('data-id');
        var fileModel = this.previewFiles.get(fileModelId);

        if (!fileModel) {
            fileModel = this.commentFilesCollection.get(fileModelId);
        }

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

    onshowAllDescriptionInComment: function (e) {
        var $target = $(e.target);
        var $descriptionBlock = $target.closest('.commentDescription').find('#commentBody');

        $descriptionBlock.toggleClass('showAllDescription');
    },

    onShowFilesInComment: function (e) {
        var self = this;
        var $target = $(e.target);
        var commentId = $target.closest('.commentWrap').data().id;
        var $showFilesBlock = $target.closest('.commentDescription').find('#showFilesBlock');
        var showFiles = $target.hasClass('showFiles');
        var $loadFiles = $target.hasClass('loadFile');
        var commentModel = this.commentCollection.get(commentId);
        var attachments = commentModel.get('attachments');

        $target.toggleClass('showFiles');

        if (!showFiles) {
            if (!$loadFiles && attachments.length) {
                dataService.getData('/comment/' + commentId, {}, function (err, filesCollection) {
                    if (err) {
                        return App.render(err);
                    }

                    $target.addClass('loadFile');

                    if (!self.commentFilesCollection) {
                        self.commentFilesCollection = new FileCollection(filesCollection);
                    } else {
                        self.commentFilesCollection.setAndUpdateModels(filesCollection);
                    }

                    self.showFilesInComment($showFilesBlock, filesCollection);
                });
            } else {
                $showFilesBlock.show();
            }
        } else {
            $showFilesBlock.hide();
        }
    },

    showFilesInComment: function ($showFilesBlock, files) {
        var self = this;

        $showFilesBlock.html('');

        files.forEach(function (file) {
            $showFilesBlock.append(self.fileTemplate({
                model: file
            }));
        });
    },

    showHideTopButtons: function (ui) {
        var $li = $(ui.newTab);
        var tab = $li.attr('aria-controls');
        var $topButtons = $li.closest('.tabs').find('#topButtons');

        if (tab === 'main') {
            $topButtons.show();
        } else {
            $topButtons.hide();
        }
    },

    openForm: function () {
        var modelJSON = this.model.toJSON();
        var form = modelJSON.form;
        var id = form._id;
        var self = this;
        var branchesForVisibility = _.map(modelJSON.branch, function (branch) {
            return branch.name.currentLanguage;
        });

        dataService.getData('/form/visibility/' + form._id, {}, function (err, response) {
            if (err) {
                return App.renderErrors([
                    ERROR_MESSAGES.somethingWentWrong[self.currentLanguage]
                ]);
            }

            if (response.after.description) {
                self.afterPartFilled = true;
            } else {
                self.afterPartFilled = false;
            }

            var arrayOfAssigneeId = modelJSON.assignedTo.map(function (item) {
                return item._id;
            });

            var permittedToEditAfterPart = (
                arrayOfAssigneeId.includes(App.currentUser._id)
                && [CONSTANTS.OBJECTIVE_STATUSES.IN_PROGRESS, CONSTANTS.OBJECTIVE_STATUSES.RE_OPENED].includes(modelJSON.status._id)
                && modelJSON.objectiveType === 'individual'
                && App.currentUser.workAccess
            );

            self.visibilityFormPreview = new VisibilityForm({
                translation: self.translation,
                visibilityFormData: response,
                branches: branchesForVisibility,
                location: modelJSON.location,
                withoutBranches: true,
                beforeDescription: modelJSON.description.currentLanguage,
                permittedToEditAfterPart: permittedToEditAfterPart
            });
            self.visibilityFormPreview.on('visibility-form-updated', function (vfData) {
                if (vfData.after.description) {
                    self.afterPartFilled = true;
                } else {
                    self.afterPartFilled = false;
                }
            });
        });
    },

    duplicateInStoreTask: function () {
        var jsonModel = this.model.toJSON();
        var model = new Model({
            objectiveType: jsonModel.objectiveType,
            priority     : jsonModel.priority,
            status       : CONSTANTS.OBJECTIVE_STATUSES.DRAFT,
            level        : jsonModel.level,
            createdBy    : jsonModel.createdBy,
            title        : jsonModel.title,
            description  : jsonModel.description,
            assignedTo   : [],
            dateStart    : '',
            dateEnd      : '',
            location     : ''
        }, {parse: true});

        this.trigger('showEditInStoreTaskDialog', model, true);
        this.$el.dialog('close').dialog('destroy').remove();
    },

    editInStoreTask: function () {
        this.off('change');
        this.$el.dialog('destroy');
        this.trigger('showEditInStoreTaskDialog', this.model);
    },

    locationSelected: function (data) {
        var $personnelLocation = this.$el.find('#personnelLocation');

        this.changed.country = data.country;
        this.changed.region = data.region;
        this.changed.subRegion = data.subRegion;
        this.changed.retailSegment = data.retailSegment;
        this.changed.outlet = data.outlet;
        this.changed.branch = data.branch;

        $personnelLocation.html(data.location);
        $personnelLocation.attr('data-location', data.location);

        this.changed.location = data.location;
    },

    showPersonnelView: _.debounce(function () {
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

            self.treeView = new TreeView({
                ids             : personnelsIds,
                instoreObjective: true,
                selectedLevel   : jsonPersonnels[0].accessRole.level,
                translation     : self.translation
            });
            self.treeView.on('locationSelected', self.locationSelected, self);
            self.$el.find('#assignTo').html(personnelsNames);
            self.changed.assignedTo = personnelsIds;
        });
    }, 1000, true),

    showAttachDialog: function () {
        var self = this;

        this.fileDialogView = new FileDialogView({
            files      : this.files,
            contentType: this.contentType,
            translation: this.translation,
            dialogTitle: this.translation.dialogTitle,
            buttonName : this.translation.attach
        });
        this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
        this.fileDialogView.on('removeFile', this.removeFile, this);
        this.fileDialogView.on('fileDialogClosed', function () {
            self.chengeCountOfAttachedFilesToComment(self.files.length ? self.files.length : '');
        });
    },

    chengeCountOfAttachedFilesToComment: function (count) {
        this.$el.find('#newCommentAttachments').text(count);
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

            self.$el.find('#filesBlock').show();
            self.fileDialogView.trigger('fileSelected', fileModel);
            App.masonryGrid.call(self.$el);
        };

    },

    attachFile: function () {
        var fileInput;
        var fileModel = new FileModel();

        this.files.add(fileModel);
        this.$el.find('#commentForm').append('<input type="file" accept="' + this.ALLOWED_CONTENT_TYPES.join(', ') + '" name="' + fileModel.cid + '" id="' + fileModel.cid + '" style="display: none">');
        fileInput = this.$el.find('#' + fileModel.cid);
        fileInput.on('change', {fileInput: fileInput}, this.fileSelected);
        fileInput.click();
    },

    sendComment: _.debounce(function () {
        var commentModel = new CommentModel();
        var self = this;

        this.commentBody = {
            commentText: this.$el.find('#commentInput').val(),
            objectiveId: this.model.get('_id'),
            context    : CONTENT_TYPES.INSTORETASKS
        };

        commentModel.setFieldsNames(this.translation);

        commentModel.validate(this.commentBody, function (err) {
            if (err && err.length) {
                App.renderErrors(err);
            } else {
                self.checkForEmptyInput(self.files, self.$el);
                self.$el.find('#commentForm').submit();
            }
        });
    }, 1000, true),

    commentFormSubmit: function (e) {
        var context = e.data.context;
        var data = new FormData(this);

        e.preventDefault();
        data.append('data', JSON.stringify(context.commentBody));

        $.ajax({
            url        : context.commentCollection.url,
            type       : 'POST',
            data       : data,
            contentType: false,
            processData: false,
            success    : function (comment) {
                var commentModel = new CommentModel(comment, {parse: true});
                var jsonComment = commentModel.toJSON();

                context.commentCollection.add(commentModel);
                context.model.set({comments: _.pluck(context.commentCollection, '_id')});
                context.$el.find('#commentWrapper').prepend(context.newCommentTemplate({
                    comment    : jsonComment,
                    translation: context.translation
                }));
                context.$el.find('#commentInput').val('');
                context.files.reset([]);
                context.$el.find('#commentForm').html('');

                if (context.commentCollection.length === 1) {
                    context.$el.find('.objectivesPaddingBlock').show();
                }

                context.trigger('modelSaved', context.model);
            }
        });

    },

    setSelectedFiles: function (files) {
        var self = this;
        var $fileContainer = self.$el.find('#objectiveFileThumbnail');

        if (files.length) {
            self.$el.find('#objectiveFiles').show();
        }

        $fileContainer.html('');

        files.forEach(function (file) {
            $fileContainer.append(self.fileTemplate({
                model: file
            }));
        });
        App.masonryGrid.call(self.$el);
    },

    setForm: function (form) {
        var $el = this.$el;
        var $formContainer = $el.find('#objectiveFormThumbnail');
        this.linkedForm = _.findWhere(CONSTANTS.OBJECTIVES_FORMS, {_id: form.contentType}) || {};

        $formContainer.html('');

        $formContainer.append(this.formTemplate({
            name       : this.linkedForm.name[this.currentLanguage],
            id         : form._id,
            translation: this.translation
        }));

        $el.find('.formBlock').show();
    },

    renderComment: function () {
        var $commentWrapper = this.$el.find('#commentWrapper');
        var $commentScrollableContainer = $commentWrapper.closest('.innerScroll');
        var jsonCollection = this.commentCollection.toJSON();

        if (jsonCollection.length) {
            $commentScrollableContainer.show();
        }

        $commentWrapper.html('');
        $commentWrapper.append(this.commentTemplate({
            collection : jsonCollection,
            translation: this.translation
        }));

        return this;
    },

    save: function (options, cb) {
        var saveObj;
        var self = this;
        var STATUSES = CONSTANTS.OBJECTIVE_STATUSES;
        var status = this.$el.find('#statusDd').data().id;
        var savedForm = self.modelForFlow.get('additionalFormData');
        var isFilledAfterPart = false;

        if (status === STATUSES.COMPLETED) {
            if (savedForm.after.description) {
                isFilledAfterPart = true;
            }

            if (self.savedVisibilityModel && self.savedVisibilityModel.get('descriptionAfter')) {
                isFilledAfterPart = true;
            }

            if (!isFilledAfterPart) {
                return App.render({
                    type : 'error',
                    message : ERROR_MESSAGES.afterPartNotFilled[App.currentUser.currentLanguage]
                });
            }
        }

        if (status && status !== this.model.get('status')._id) {
            this.changed.status = status;
            this.model.set('status', status);
        }

        if (!Object.keys(this.changed).length) {
            cb();
        } else {
            saveObj = {
                changed    : this.changed,
                attachments: _.pluck(this.model.get('attachments'), '_id')
            };

            this.model.setFieldsNames(this.translation, this.changed);

            this.model.save(saveObj, {
                success: function () {
                    self.trigger('modelSaved', self.model);

                    if (self.progressChanged) {
                        self.trigger('changeProgress');
                        self.progressChanged = false;
                    }

                    cb();
                },
                error  : function (model, res) {
                    var err = res.responseJSON || res.responseText;

                    App.render(err);
                }
            });
        }
        if (this.visibilityFormAjax) {
            async.waterfall([

                function (cb) {
                    var visibilityFormAjax = self.visibilityFormAjax;
                    var VFData = null;
                    var file = null;

                    if (visibilityFormAjax) {
                        VFData = self.visibilityFormAjax.data;
                    }

                    if (VFData) {
                        file = self.visibilityFormAjax.data.get('inputAfter');
                    }

                    if (file) {
                        $.ajax({
                            url : '/file',
                            method : 'POST',
                            data : VFData,
                            contentType: false,
                            processData: false,
                            success : function (response) {
                                cb(null, response);
                            },
                            error : function () {
                                cb(true);
                            }
                        });
                    } else {
                        cb(null, {
                            files : []
                        });
                    }
                },

                function (files, cb) {
                    delete self.visibilityFormAjax.model;

                    self.visibilityFormAjax.contentType = 'application/json';
                    self.visibilityFormAjax.dataType = 'json';

                    self.visibilityFormAjax.success = function() {
                        return cb();
                    };

                    self.visibilityFormAjax.error = function() {
                        return cb(true);
                    };

                    self.visibilityFormAjax.url = '/form/visibility/after/' + self.model.get('form')._id;

                    var description = self.visibilityFormAjax.data.get('description');

                    self.visibilityFormAjax.data = JSON.stringify({
                        after : {
                            files : files.files.map(function (item) {
                                return item._id;
                            }),
                            description : description
                        }
                    });

                    $.ajax(self.visibilityFormAjax);
                }

            ], function (err) {
                if (err) {
                    return App.render({
                        type : 'error',
                        message : ERROR_MESSAGES.notSaved[App.currentUser.currentLanguage]
                    });
                }
            });
        }
    },

    renderStatus: function (jsonModel) {
        var selector = '#statusDd';

        var STATUSES = CONSTANTS.OBJECTIVE_STATUSES;
        var statusId = jsonModel.status._id;
        var createdByMe = jsonModel.createdBy.user._id === App.currentUser._id;
        var condition = (statusId === STATUSES.IN_PROGRESS && createdByMe)
            || (statusId === STATUSES.COMPLETED && !createdByMe)
            || (statusId === STATUSES.CLOSED)
            || (statusId === STATUSES.FAIL)
            || (statusId === STATUSES.OVER_DUE && !createdByMe)
            || this.activityList
            || jsonModel.myCC
            || !App.currentUser.workAccess;

        var objectiveStatuses = objectivesStatusHelper(jsonModel);
        var statusDisplayModel = _.findWhere(objectiveStatuses, {_id: statusId});

        var statusToRemove;

        if (condition) {
            this.$el.find(selector).html(statusDisplayModel.name.currentLanguage);
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
        var jsonModel = this.model.toJSON();
        var formString;
        var self = this;
        var jsonFlowModel = this.modelForFlow.toJSON();
        var buttons = {};
        var configForTemplate = CONTROLS_CONFIG[App.currentUser.accessRole.level].preview;
        var configForActivityList = CONTROLS_CONFIG.activityList.preview;

        jsonModel.myCC = self.tabName === 'myCC';

        buttons.save = {
            text : this.translation.okBtn,
            class: 'btn saveBtn objectiveClose',
            click: function () {
                self.save({save: false}, function () {
                    self.undelegateEvents();
                    self.$el.dialog('close').dialog('destroy').remove();
                });

            }
        };

        if (jsonModel.status._id === CONSTANTS.OBJECTIVE_STATUSES.CLOSED
            && App.currentUser._id !== jsonModel.createdBy.user._id) {
            return false;
        }

        if (!this.dontShowDialog) {
            formString = this.template({
                translation: this.translation,
                hiddenActions : self.tabName === 'myCC' ? 'hidden' : ''
            });
        } else {
            formString = this.$el;
        }

        formString = $(formString);

        formString.find('#main').html(this.updatedTemplate({
            jsonModel  : jsonModel,
            translation: this.translation
        }));
        this.taskFlowView = formString.find('#taskFlow').html(this.taskFlow({
            model      : jsonFlowModel,
            translation: this.translation
        }));

        this.taskFlowView.on('click', function (e) {
            var $target = $(e.currentTarget);

            $target.closest('.tabs').tabs('option', 'active', 0);
        });


        if (!this.dontShowDialog) {
            this.$el = formString.dialog({
                dialogClass  : 'create-dialog full-height-dialog',
                title        : this.translation.taskPreview,
                width        : '1000',
                showCancelBtn: false,
                buttons      : buttons,
                close        : function () {
                    var model = self.model;
                    var id;
                    var previousAttributes;

                    if (model.changedAttributes()) {
                        id = model.get('_id');
                        previousAttributes = model.previousAttributes();
                        model.clear();
                        model.set(previousAttributes);
                        model.set({_id: id});
                    }

                    $('body').css({overflow: 'inherit'});
                }
            });
        }

        if ([CONSTANTS.OBJECTIVE_STATUSES.CLOSED, CONSTANTS.OBJECTIVE_STATUSES.COMPLETED, CONSTANTS.OBJECTIVE_STATUSES.OVER_DUE, CONSTANTS.OBJECTIVE_STATUSES.FAIL].indexOf(jsonModel.status._id) === -1 && App.currentUser.workAccess) {
            if (!this.activityList) {
                configForTemplate.forEach(function (config) {
                    var createdByMe = jsonModel.createdBy.user._id === App.currentUser._id;
                    var historyByMe = jsonModel.history;

                    if (App.currentUser.workAccess) {
                        if (config.forAll || (createdByMe && !config.forAllWithoutMy) || (!createdByMe && config.forAllWithoutMy) || (historyByMe.length && config.forAllWithoutMy)) {
                            var container = self.$el.find(config.selector);
                            var template = lodash.get(modules, config.template);

                            if (!container.find('#' + config.elementId).length) {
                                container[config.insertType](template({
                                    elementId  : config.elementId,
                                    translation: self.translation
                                }));
                            }
                        }
                    }
                });
            } else {
                configForActivityList.forEach(function (config) {
                    var container = self.$el.find(config.selector);
                    var template = lodash.get(modules, config.template);

                    if (!container.find('#' + config.elementId).length) {
                        container[config.insertType](template({
                            elementId  : config.elementId,
                            translation: self.translation
                        }));
                    }
                });
            }
        }

        this.$el.find('#commentForm').on('submit', {
            body   : this.commentBody,
            context: this
        }, this.commentFormSubmit);
        this.$el.find('#fileThumbnail').hide();
        this.$el.find('#descriptionArContainer').hide();
        this.$el.find('#companyObjectiveArContainer').hide();
        this.$el.find('#titleAr').hide();

        implementShowHideArabicInputIn(this);

        this.renderStatus(jsonModel);

        this.setSelectedFiles(jsonModel.attachments);

        if (jsonModel.form) {
            this.setForm(jsonModel.form);
        }

        this.commentCollection = new CommentCollection({
            data: {
                objectiveId: this.model.get('_id'),
                reset      : true
            }
        });

        this.commentCollection.on('reset', this.renderComment);

        this.delegateEvents(this.events);

        return this;
    }
});
