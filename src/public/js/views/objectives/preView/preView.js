var $ = require('jquery');
var _ = require('underscore');
var moment = require('moment');
var PreviewTemplate = require('../../../../templates/objectives/preview.html');
var FormTemplate = require('../../../../templates/objectives/form/form.html');
var FileTemplate = require('../../../../templates/file/preView.html');
var CommentTemplate = require('../../../../templates/objectives/comments/comment.html');
var NewCommentTemplate = require('../../../../templates/objectives/comments/newRow.html');
var FileCollection = require('../../../collections/file/collection');
var FileModel = require('../../../models/file');
var CommentModel = require('../../../models/comment');
var BaseView = require('../../../views/baseDialog');
var FileDialogView = require('../../../views/objectives/fileDialogView');
var EffortsDialog = require('../../../views/objectives/efforts');
var CommentCollection = require('../../../collections/comment/collection');
var populate = require('../../../populate');
var CONSTANTS = require('../../../constants/otherConstants');
var implementShowHideArabicInputIn = require('../../../helpers/implementShowHideArabicInputIn');
var objectivesStatusHelper = require('../../../helpers/objectivesStatusHelper');
var dataService = require('../../../dataService');
var DistributionForm = require('../../../views/objectives/distributionFormView');
var VisibilityForm = require('../../../views/objectives/visibilityForm/overview');
var UpdatedPreview = require('../../../../templates/objectives/updatedPreview.html');
var TaskFlowTemplate = require('../../../../templates/objectives/taskFlowTemplate.html');
var ObjectivesModel = require('../../../models/objectives');
var ObjectiveCollection = require('../../../collections/objectives/collection');
var EditObjectiveView = require('../../../views/objectives/editObjectiveView');
var DefFilters = require('../../../helpers/defFilterLogic');
var FileDialogPreviewView = require('../../../views/fileDialog/fileDialog');
var CONTENT_TYPES = require('../../../constants/contentType');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var SubObjectiveView = require('../../../views/objectives/viewSubObjective');
var App = require('../../../appState');
var LEVEL_CONFIG = require('../../../constants/levelConfig');
var CONTROLS_CONFIG = LEVEL_CONFIG[CONTENT_TYPES.OBJECTIVES];
var requireContent = require('../../../helpers/requireContent');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.OBJECTIVES,

    template             : _.template(PreviewTemplate),
    commentTemplate      : _.template(CommentTemplate),
    newCommentTemplate   : _.template(NewCommentTemplate),
    formTemplate         : _.template(FormTemplate),
    fileTemplate         : _.template(FileTemplate),
    updatedTemplate      : _.template(UpdatedPreview),
    taskFlow             : _.template(TaskFlowTemplate),
    dontShowDialog       : false,
    CONSTANTS            : CONSTANTS,
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
        'click #createSubObjective'       : 'createSubObjective',
        'click #viewSubObjective'         : 'viewSubObjective',
        'click #assign'                   : 'assignObjective',
        'click #assignACM'                : 'assignObjectivesToACM',
        'click #assignElse'               : 'assignObjectivesToElse',
        'click #edit'                     : 'editObjective',
        'click .formThumbnail'            : 'openForm',
        'click #duplicate'                : 'duplicateObjective',
        'click .commentBottom .attachment': 'onShowFilesInComment',
        'click #showAllDescription'       : 'onshowAllDescriptionInComment',
        'click .templateWrap'             : 'onTreePreview',
        'click .fileThumbnailItem'        : 'showFilePreviewDialog',
        'click #goToBtn'                  : 'goTo',
        'click #downloadFile'             : 'stopPropagation'
    },

    initialize: function (options) {
        var self = this;

        this.defFilterLogic = new DefFilters(App.currentUser._id);
        this.translation = options.translation;
        this.tabName = options.tabName;
        this.activityList = options.activityList;
        this.model = options.model.toJSON() ? options.model : new ObjectivesModel(options.model, {parse: true});
        this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
        this.changed = {};

        this.files = new FileCollection();
        this.previewFiles = new FileCollection(this.model.get('attachments'), true);
        _.bindAll(this, 'fileSelected', 'renderComment');

        this.flowTreeCollection = new ObjectiveCollection({
            url: '/objectives/tree/' + this.model.get('_id')
        });

        this.flowTreeCollection.on('reset', function () {
            self.flowTreeCollection.composeFlowTree(self.model.get('level'), function (err, result) {
                if (err) {
                    return App.render(err);
                }

                self.flowTreeCollection = result;
                self.makeRender();
                self.render();
            });
        });

        var withoutBranches = !this.model.get('branch').length;
        var form = this.model.get('form');

        if (form && form._id && form.contentType === 'visibility') {
            dataService.getData('/form/visibility/' + form._id, {}, function (err, response) {
                if (withoutBranches) {
                    if (response.after.description) {
                        self.afterPartFilled = true;
                    }
                } else {
                    self.afterPartFilled = true;

                    response.branches.forEach(function (branch) {
                        if (!branch.after.description) {
                            self.afterPartFilled = false;
                        }
                    });
                }
            });
        }

        this.progressChanged = false;

        this.on('updatePreview', function (model) {
            self.model = model;
            self.dontShowDialog = true;
            self.render();
        });
    },

    viewSubObjective: function (e) {
        var self = this;
        var level = this.model.get('level');
        var objectiveId = this.model.get('_id');
        var filter = {
            'createdBy.user': {
                type  : 'ObjectId',
                values: [App.currentUser._id]
            }
        };

        filter['parent.' + level] = {
            type  : 'ObjectId',
            values: [objectiveId]
        };

        dataService.getData(this.contentType, {filter: filter}, function (err, subObjectiveCollection) {
            var newSubCollection;
            if (err) {
                return App.render(err);
            }

            if (!subObjectiveCollection.data || !subObjectiveCollection.data.length) {
                return App.render({type: 'error', message: ERROR_MESSAGES.noSubObjectives[self.currentLanguage]});
            }

            newSubCollection = new ObjectiveCollection(subObjectiveCollection, {parse: true});
            self.subObjectiveView = new SubObjectiveView({
                translation: self.translation,
                collection : newSubCollection
            });
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

    onTreePreview: function (e) {
        var self = this;
        var $templateWrap;
        var objectiveId;

        if (this.activityList) {
            return false;
        }

        $templateWrap = $(e.target).closest('.templateWrap');

        if ($templateWrap.hasClass('processing')) {
            return;
        }

        $templateWrap.addClass('processing');

        objectiveId = $templateWrap.attr('id');

        if (objectiveId === this.model.get('_id')) {
            return;
        }

        this.treeModel = new ObjectivesModel({_id: objectiveId});
        this.treeModel.fetch();
        this.treeModel.on('sync', function () {
            self.treeModel.off('sync');

            self.treePreview = new PreviewView({
                model      : self.treeModel,
                translation: self.translation
            });

            self.treePreview.on('modelSaved', function (model) {
                self.changeRowInTree(model);
            });

            self.treePreview.on('showSubObjectiveDialog', self.showSubObjectiveDialog, self);
            self.treePreview.on('showAssignObjectiveDialog', self.showAssignObjectiveDialog, self);
            self.treePreview.on('showEditObjectiveDialog', self.showEditObjectiveDialog, self);
            self.treePreview.on('changeProgress', self.changeProgress, self);

            self.treePreview.on('dialogbeforeclose', function () {
                $templateWrap.removeClass('processing');
            });
        });
    },

    changeProgress: function () {
        var self = this;

        dataService.getData('/' + this.contentType + '/' + this.model.get('_id'), {}, function (err, model) {
            if (err) {
                return App.render(err);
            }

            self.progress.barrating('readonly', false);
            self.progress.barrating('set', model.complete);
            self.progress.barrating('readonly', true);
        });
    },

    showEditObjectiveDialog: function (model, duplicate) {
        var self = this;

        this.editObjectiveView = new EditObjectiveView({
            model: model,
            duplicate: duplicate,
            translation: this.translation,
        });

        this.editObjectiveView.on('modelSaved', function (model) {
            self.changeRowInTree(model);
        });
    },

    changeRowInTree: function (model) {
        var jsonModel = model.toJSON();
        var $div = this.$el.find('#' + jsonModel._id);
        var $assignedTo = $div.find('.assignedTo');
        var string = '';
        var self = this;

        $div.find('.createdByImage').attr('src', jsonModel.createdBy.user.imageSrc);
        $div.find('.createdByName').html(jsonModel.createdBy.user.firstName.currentLanguage + ' ' + jsonModel.createdBy.user.lastName.currentLanguage);
        $div.find('.createdByAccessRole').html(jsonModel.createdBy.user.accessRole.name.currentLanguage);
        $div.find('.createdByPosition').html(jsonModel.createdBy.user.position.name.currentLanguage);
        $div.find('.attachmentsCount').html(jsonModel.attachments.length);
        $div.find('.commentsCount').html(jsonModel.comments.length);
        $div.find('.objectiveTitle').html(jsonModel.title.currentLanguage);
        $div.find('.status').html(jsonModel.status.name);
        $div.find('.objectiveDescription').html(jsonModel.description.currentLanguage);
        $div.find('.priority').html(self.translation.priority + ': ' + jsonModel.priority);
        $div.find('.location').html(self.translation.location + ': ' + jsonModel.location);
        $div.find('.startDate').html(jsonModel.dateStart);
        $div.find('.endDate').html(jsonModel.dateEnd);

        jsonModel.assignedTo.forEach(function (assignedTo) {
            string += '<img src="' + assignedTo.imageSrc + '" class="imgCircle userImgSmall">' +
                '<div class="description fontGray">' +
                assignedTo.firstName.currentLanguage + ' ' + assignedTo.lastName.currentLanguage + '</div>'
        });

        $assignedTo.html(string);

        $div.find('.progressRateInner').width(jsonModel.complete + '%');
        $div.find('.percent').html(jsonModel.complete + '%');
    },

    effortsStarter: function (e) {
        var assignedTo = this.model.get('assignedTo');
        var level;
        var viewOptions = {};

        if (assignedTo.length === 2) {
            level = assignedTo[0] && assignedTo[0].accessRole.level || -1;

            if ((e.$item.attr('id') === 'closed') && (!this.effortsSet) && (level > 4 && level < 8)) {
                viewOptions.model = this.model;
                viewOptions.$objectivesPreview = this.$el;
                viewOptions.contentType = this.contentType;
                viewOptions.translation = this.translation;
                this.effortsSet = true;
                this.effortsDialog = new EffortsDialog(viewOptions);
            }
        }

        this.off('changeItem', this.effortsStarter, this);
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

    onshowAllDescriptionInComment: function (e) {
        var $target = $(e.target);
        var $descriptionBlock = $target.closest('.commentDescription').find('#commentBody');

        $descriptionBlock.toggleClass('showAllDescription');
    },

    openForm: _.debounce(function () {
        var self = this;
        var modelJSON = this.model.toJSON();
        var form = modelJSON.form;
        var branchesForVisibility = _.map(modelJSON.branch, function (branch) {
            return {
                name : branch.name.currentLanguage,
                _id : branch._id
            };
        });

        if (modelJSON.status._id === CONSTANTS.OBJECTIVE_STATUSES.CLOSED
            && App.currentUser._id !== modelJSON.createdBy.user._id
            && modelJSON.createdBy.user.accessRole.level < App.currentUser.accessRole.level) {
            return false;
        }

        if (form.contentType === 'distribution') {
            this.distributionForm = new DistributionForm({
                id: form._id,
                translation: this.translation
            });
        } else {
            dataService.getData('/form/visibility/' + form._id, {}, function (err, response) {
                if (err) {
                    return App.renderErrors([
                        ERROR_MESSAGES.somethingWentWrong[self.currentLanguage]
                    ]);
                }

                var withoutBranches = !branchesForVisibility.length;

                if (withoutBranches) {
                    if (response.after.description) {
                        self.afterPartFilled = true;
                    } else {
                        self.afterPartFilled = false;
                    }
                } else {
                    self.afterPartFilled = true;

                    response.branches.forEach(function (branch) {
                        if (!branch.after.description) {
                            self.afterPartFilled = false;
                        }
                    });
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
                    withoutBranches: withoutBranches,
                    beforeDescription: modelJSON.description.currentLanguage,
                    permittedToEditAfterPart: permittedToEditAfterPart
                });
                self.visibilityFormPreview.on('visibility-form-updated', function (vfData) {

                    if (withoutBranches) {
                        if (vfData.after.description) {
                            self.afterPartFilled = true;
                        } else {
                            self.afterPartFilled = false;
                        }
                    } else {
                        self.afterPartFilled = true;

                        vfData.branches.forEach(function (branch) {
                            if (!branch.after.description) {
                                self.afterPartFilled = false;
                            }
                        });
                    }
                });
            });
        }
    }, 1000, true),

    duplicateObjective: function () {
        var jsonModel = this.model.toJSON();
        var model = {
            objectiveType: jsonModel.objectiveType,
            priority     : jsonModel.priority,
            status       : CONSTANTS.OBJECTIVE_STATUSES.DRAFT,
            level        : jsonModel.level,
            createdBy    : {
                date: moment(jsonModel.createdBy.date, 'DD.MM.YYYY').toISOString(),
                user: jsonModel.createdBy.user
            },
            title        : jsonModel.title,
            description  : jsonModel.description,
            assignedTo   : [],
            dateStart    : '',
            dateEnd      : '',
            location     : ''
        };

        this.trigger('showEditObjectiveDialog', model, true);
        this.$el.dialog('close').dialog('destroy').remove();
    },

    editObjective: function () {
        this.off('change');
        this.trigger('showEditObjectiveDialog', this.model);
    },

    assignObjective: function () {
        var $el = this.$el;

        $el.find('.assignUl').toggle();
    },

    assignObjectivesToACM: function () {
        var defFilter = this.defFilterLogic.getDefFilter('personnel', 'assignToACM');
        var modelJSON = this.model.toJSON();

        if (modelJSON.objectiveType === 'country') {
            this.trigger('showSubObjectiveDialog', this.model, false, defFilter);
        } else {
            this.trigger('showAssignObjectiveDialog', this.model, false, defFilter);
        }
        this.assignObjective();
    },

    assignObjectivesToElse: function () {
        var defFilter = this.defFilterLogic.getDefFilter('personnel', 'assignToElse');
        var modelJSON = this.model.toJSON();

        if (modelJSON.objectiveType === 'country') {
            this.trigger('showSubObjectiveDialog', this.model, true, defFilter);
        } else {
            this.trigger('showAssignObjectiveDialog', this.model, true, defFilter);

        }
        this.assignObjective();
    },

    createSubObjective: function () {
        this.trigger('showSubObjectiveDialog', this.model);
    },

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
            context    : CONTENT_TYPES.OBJECTIVES
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
                    comment      : jsonComment,
                    translation  : context.translation,
                    notShowAttach: false
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
            collection   : jsonCollection,
            translation  : this.translation,
            notShowAttach: false
        }));

        return this;
    },

    save: function (options, cb) {
        var saveObj;
        var self = this;
        var STATUSES = CONSTANTS.OBJECTIVE_STATUSES;
        var status = this.$el.find('#statusDd').attr('data-id');
        var createdByUserId = self.model.get('createdBy').user._id;
        var currentUserId = App.currentUser._id;

        if (status === STATUSES.COMPLETED && createdByUserId !== currentUserId) {
            if (this.model.get('form') && !self.afterPartFilled) {
                return App.render({
                    type : 'error',
                    message : ERROR_MESSAGES.afterPartNotFilled[App.currentUser.currentLanguage]
                });
            }
        }

        if (status && status !== this.model.get('status')._id) {
            this.changed.status = status;
            _.map(CONSTANTS.OBJECTIVESTATUSES_FOR_UI, function (statusConst) {
                if (statusConst._id === status) {
                    status = statusConst;
                }
            });
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
                patch  : true,
                success: function () {
                    self.trigger('modelSaved', self.model);

                    if (self.progressChanged) {
                        self.trigger('changeProgress');
                        self.progressChanged = false;
                    }

                    cb();
                },
                error  : function (model, res) {
                    var err = res.responseJSON || res.responseText || {};

                    App.render(err);
                }
            });
        }
    },

    renderStatus: function (jsonModel) {
        var selector = '#statusDd';

        var STATUSES = CONSTANTS.OBJECTIVE_STATUSES;
        var statusId = jsonModel.status._id;
        var coveredIds = App.currentUser.covered ? Object.keys(App.currentUser.covered) : [];
        var assignToIds = _.pluck(jsonModel.assignedTo, '_id');
        var isUserAssignedToAndCover = this.tabName === 'myCover' ? _.intersection(assignToIds, coveredIds) : [];
        var isCountryObjective = (jsonModel.objectiveType === 'country') && (App.currentUser.accessRole.level === 1);

        var createdByMe = jsonModel.createdBy.user._id === App.currentUser._id && !isUserAssignedToAndCover.length;
        var createdByMyCover = coveredIds.indexOf(jsonModel.createdBy.user._id) !== -1;
        var condition = (statusId === STATUSES.IN_PROGRESS && (createdByMe || createdByMyCover))
            || (statusId === STATUSES.COMPLETED && !createdByMe && !createdByMyCover)
            || (statusId === STATUSES.CLOSED)
            || (statusId === STATUSES.FAIL)
            || (statusId === STATUSES.OVER_DUE && !createdByMe && !createdByMyCover)
            || (statusId === STATUSES.RE_OPENED && (createdByMe || createdByMyCover))
            || this.activityList
            || jsonModel.myCC
            || !App.currentUser.workAccess
            || isCountryObjective;

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
        var effortsHTML = '';
        var coveredIds = App.currentUser.covered ? Object.keys(App.currentUser.covered) : [];
        var assignToIds = _.pluck(jsonModel.assignedTo, '_id');
        var isUserAssignedToAndCover = this.tabName === 'myCover' ? _.intersection(assignToIds, coveredIds) : [];
        var createdByMe = jsonModel.createdBy.user._id === App.currentUser._id && !isUserAssignedToAndCover.length;
        var configForTemplate = CONTROLS_CONFIG[App.currentUser.accessRole.level].preview;
        var onfigForActivityList = CONTROLS_CONFIG.activityList.preview;
        var isCountryObjective = (jsonModel.objectiveType === 'country') && (App.currentUser.accessRole.level === 1);

        if (!this.dontShowDialog) {
            formString = this.template({
                translation : this.translation,
                activiryList: this.activityList,
                hiddenActions : self.tabName === 'myCC' ? 'hidden' : ''
            });
        } else {
            formString = this.$el;
        }

        formString = $(formString);

        jsonModel.myCC = self.tabName === 'myCC';

        formString.find('#main').html(this.updatedTemplate({
            jsonModel   : jsonModel,
            translation : this.translation,
            activiryList: this.activityList,
            App: App,
        }));
        formString.find('#taskFlow').html(this.taskFlow({
            model       : this.flowTreeCollection,
            translation : this.translation,
            activiryList: this.activityList
        }));

        if (!this.dontShowDialog) {
            this.$el = formString.dialog({
                dialogClass  : 'create-dialog full-height-dialog',
                title        : 'Objective Preview',
                width        : '1000',
                showCancelBtn: false,
                buttons      : {
                    save: {
                        text : self.translation.okBtn,
                        class: 'btn saveBtn objectiveClose',
                        click: function () {
                            self.save({save: false}, function () {
                                self.undelegateEvents();
                                self.$el.dialog('close').dialog('destroy').remove();
                            });
                        }
                    }
                },
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
                },
                beforeClose  : function () {
                    self.trigger('dialogbeforeclose');
                }
            });
        }

        if ([CONSTANTS.OBJECTIVE_STATUSES.CLOSED, CONSTANTS.OBJECTIVE_STATUSES.COMPLETED].indexOf(jsonModel.status._id) === -1) {
            var individualObjective = jsonModel.objectiveType === 'individual';

            if (!this.activityList) {
                configForTemplate.forEach(function (config) {
                    var canDisplay = config.forAll || (createdByMe && !config.forAllWithoutMy) || (!createdByMe && config.forAllWithoutMy);
                    var assignInIndividual = jsonModel.objectiveType === 'individual' && config.elementId === 'assign';
                    if (App.currentUser.accessRole.level === 2 && jsonModel.objectiveType === 'individual' && config.selector === '#subObjective' || jsonModel.status._id === 'completed' || isCountryObjective) {
                        return;
                    }

                    if (canDisplay && !assignInIndividual && jsonModel.status !== CONSTANTS.OBJECTIVE_STATUSES.CLOSED && App.currentUser.workAccess) {
                        if (!(individualObjective && config.elementId === 'viewSubObjective')) {
                            var container = self.$el.find(config.selector);
                            var template = _.template(requireContent(config.template));

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
                onfigForActivityList.forEach(function (config) {
                    var container = self.$el.find(config.selector);
                    var template = _.template(requireContent(config.template));

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

        if ((this.model.attributes.efforts) && (this.model.attributes.efforts.length > 0) && (this.model.attributes.status._id === 'closed')) {

            this.model.attributes.assignedTo.forEach(function (item, i, arr) {
                var id = item._id; // assigned ids
                var idd; // efforts persons ids
                var lengthEfforts = self.model.attributes.efforts.length;
                var effortsPresent = false;
                var color = 'textOrange';
                var i;

                effortsHTML += '<a>' + item.firstName.currentLanguage + ' ' + item.lastName.currentLanguage;
                for (i = 0; i < lengthEfforts; i++) {
                    idd = self.model.attributes.efforts[i].person;
                    if (idd === id) {
                        effortsHTML += '<span class="' + color + '">Achieved ' + self.model.attributes.efforts[i].effort + '%</span>';
                        effortsPresent = true;
                    }
                }
                effortsHTML += '</a>';
                if (!effortsPresent) {
                    effortsHTML = false;
                }
            });

            if (effortsHTML) {
                this.$el.find('#assignTo').html(effortsHTML);
            }
        }

        this.on('changeItem', function (e) {
            if (e.$selector) {
                if (e.$selector.attr('id') === 'statusDd') {
                    if (e.$item.attr('id') !== 'closed') {
                        this.progressChanged = true;
                        this.progress.barrating('readonly', false);

                        if (e.$item.attr('id') === 'completed') {
                            this.progress.barrating('set', 100);
                        } else {
                            this.progress.barrating('set', 0);
                        }
                        this.progress.barrating('readonly', true);
                    }

                    this.effortsStarter(e);
                }
            }
        });

        this.setSelectedFiles(jsonModel.attachments);

        if (jsonModel.form) {
            this.setForm(jsonModel.form);
        }

        this.progress = this.$el.find('#rating');
        this.progress.barrating({
            theme             : 'bars-1to10',
            showSelectedRating: true,
            readonly          : true,
            onSelect          : function (value, text, event) {
                this.$widget.find('.br-current-rating').html(text);
            }
        });

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
