var _ = require('underscore');
var $ = require('jquery');
var moment = require('moment');
var PreviewTemplate = require('../../../../templates/achievementForm/preview.html');
var FilePreviewTemplate = require('../../../../templates/file/preView.html');
var FileCollection = require('../../../collections/file/collection');
var BaseView = require('../../../views/baseDialog');
var FileDialogPreviewView = require('../../../views/fileDialog/fileDialog');
var Model = require('../../../models/achievementForm');
var LEVEL_CONFIG = require('../../../constants/levelConfig');
var EditView = require('../../../views/achievementForm/edit');
var INFO_MESSAGES = require('../../../constants/infoMessages');
var App = require('../../../appState');
var requireContent = require('../../../helpers/requireContent');
var FileDialogView = require('../../../views/objectives/fileDialogView');
var FileModel = require('../../../models/file');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var dataService = require('../../../dataService');
var CommentModel = require('../../../models/comment');
var CONTENT_TYPES = require('../../../constants/contentType');
var CommentCollection = require('../../../collections/comment/collection');
var CommentTemplate = require('../../../../templates/objectives/comments/comment.html');
var NewCommentTemplate = require('../../../../templates/objectives/comments/newRow.html');
var CONSTANTS = require('../../../constants/otherConstants');

module.exports = BaseView.extend({
    contentType: 'achievementForm',

    template           : _.template(PreviewTemplate),
    filePreviewTemplate: _.template(FilePreviewTemplate),
    commentTemplate      : _.template(CommentTemplate),
    newCommentTemplate   : _.template(NewCommentTemplate),
    ALLOWED_CONTENT_TYPES: _.union(
        CONSTANTS.IMAGE_CONTENT_TYPES,
        CONSTANTS.VIDEO_CONTENT_TYPES,
        CONSTANTS.MS_WORD_CONTENT_TYPES,
        CONSTANTS.MS_EXCEL_CONTENT_TYPES,
        CONSTANTS.MS_POWERPOINT_CONTENT_TYPES,
        CONSTANTS.OTHER_FORMATS
    ),

    events: {
        'click #attachFiles'              : 'showAttachDialog',
        'click #sendComment'              : 'sendComment',
        'click .fileThumbnailItem': 'showFilePreviewDialog',
        'click #downloadFile'     : 'stopPropagation',
        'click #goToBtn'          : 'goTo',
        'click #edit' : 'showEditView',
        'click #delete' : 'deleteAchievementForm',
    },

    initialize: function (options) {
        var self = this;

        this.activityList = options.activityList;
        this.translation = options.translation;
        this.files = new FileCollection();
        this.model = options.model.toJSON() ? options.model : new Model(options.model, {merge: true, parse: true});
        this.previewFiles = new FileCollection(this.model.get('attachments'));
        _.bindAll(this, 'fileSelected', 'renderComment');

        self.makeRender();
        self.render();
    },

    showAttachDialog: function () {
        var self = this;

        this.fileDialogView = new FileDialogView({
            files      : this.files,
            dialogTitle: this.translation.dialogTitle,
            translation: this.translation,
            buttonName : this.translation.attach
        });
        this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
        this.fileDialogView.on('fileDialogClosed', function () {
            self.chengeCountOfAttachedFilesToComment(self.files.length ? self.files.length : '');
        });

        this.fileDialogView.on('removeFile', this.removeFile, this);
    },

    chengeCountOfAttachedFilesToComment: function (count) {
        this.$el.find('#newCommentAttachments').text(count);
    },

    removeFile: function (file) {
        var fileId = file.get('_id') || file.cid;
        var $thumbnail = this.$el.find('.fileThumbnailItem[data-id = "' + fileId + '"]');

        $thumbnail.remove();
        this.files.remove(file, {silent: true});
        this.$el.find('#' + file.cid).remove();
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
                    self.fileCollection = new FileCollection(filesCollection);
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
            $showFilesBlock.append(self.filePreviewTemplate({
                model: file
            }));
        });
    },

    onShowAllDescriptionInComment: function (e) {
        var $target = $(e.target);
        var $descriptionBlock = $target.closest('.commentDescription').find('#commentBody');

        $descriptionBlock.toggleClass('showAllDescription');
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
                App.renderErrors([ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage]]);
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
            self.$el.find('#fileThumbnail').append(self.filePreviewTemplate({
                model: model
            }));

            self.$el.find('#filesBlock').show();
            self.fileDialogView.trigger('fileSelected', fileModel);
            App.masonryGrid.call(self.$el);
        };
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

    sendComment: _.debounce(function () {
        var commentModel = new CommentModel();
        var self = this;

        this.commentBody = {
            commentText: this.$el.find('#commentInput').val(),
            objectiveId: this.model.get('_id'),
            context    : CONTENT_TYPES.ACHIEVEMENTFORM,
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

    showEditView: function () {
        var that = this;

        this.editView = new EditView({
            translation: this.translation,
            editableModel: this.model.toJSON(),
        });

        this.editView.on('edit-achievement-form-item', function (data, achievementFormId) {
            var model = new Model();

            model.edit(achievementFormId, data);

            model.on('achievement-form-edited', function (response) {
                var view = that.$el;
                var startDate = data.startDate;
                var endDate = data.endDate;

                response.startDate = moment.utc(response.startDate).format('DD.MM.YYYY');
                response.endDate = moment.utc(response.endDate).format('DD.MM.YYYY');
                that.model.set(response, {merge: true});

                if (startDate) {
                    view.find('#date-start').html(moment.utc(startDate).format('DD.MM.YYYY'));
                }

                if (endDate) {
                    view.find('#date-end').html(moment.utc(endDate).format('DD.MM.YYYY'));
                }

                view.find('#description').html(data.description[App.currentUser.currentLanguage]);
                view.find('#additionalComment').html(data.additionalComment[App.currentUser.currentLanguage]);

                that.editView.$el.dialog('close').dialog('destroy').remove();

                that.trigger('update-list-view');
            });
        });
    },

    deleteAchievementForm: function () {
        if (confirm(INFO_MESSAGES.confirmDeleteAchievementFormReport[App.currentUser.currentLanguage])) {
            var that = this;
            var model = new Model();

            model.delete(this.model.get('_id'));

            model.on('achievement-form-deleted', function () {
                that.trigger('update-list-view');

                that.$el.dialog('close').dialog('destroy').remove();
            });
        }
    },

    showFilePreviewDialog: _.debounce(function (e) {
        var $el = $(e.target);
        var $thumbnail = $el.closest('.masonryThumbnail');
        var fileModelId = $thumbnail.attr('data-id');
        var fileModel = this.previewFiles.get(fileModelId);

        this.fileDialogView = new FileDialogPreviewView({
            fileModel  : fileModel,
            bucket     : this.contentType,
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

    setSelectedFiles: function () {
        var self = this;
        var files = this.previewFiles.toJSON();
        var $fileContainer = self.$el.find('#objectiveFileThumbnail');

        if (files.length) {
            self.$el.find('.filesBlock').show();
        }

        $fileContainer.html('');

        files.forEach(function (file) {
            $fileContainer.append(self.filePreviewTemplate({
                model: file
            }));
        });
    },

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
                context.chengeCountOfAttachedFilesToComment('');

                if (context.commentCollection.length === 1) {
                    context.$el.find('.objectivesPaddingBlock').show();
                }
            }
        });

    },

    render: function () {
        var jsonModel = this.model.toJSON();
        var formString;
        var self = this;
        var currentConfig;

        if (this.activityList) {
            currentConfig = LEVEL_CONFIG[this.contentType].activityList.preview;
        } else {
            currentConfig = LEVEL_CONFIG[this.contentType][App.currentUser.accessRole.level] ? LEVEL_CONFIG[this.contentType][App.currentUser.accessRole.level].preview : [];
        }

        formString = this.$el.html(this.template({model: jsonModel, translation: this.translation, App: App,}));

        this.$el = formString.dialog({
            dialogClass  : 'create-dialog competitorBranding-dialog',
            title        : this.translation.title,
            width        : '1000',
            showCancelBtn: false,
            buttons      : {
                save: {
                    text : this.translation.saveBtn,
                    class: 'btn saveBtn',
                    click: function () {
                        self.undelegateEvents();
                        self.$el.dialog('close').dialog('destroy').remove();
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
            }
        });

        if (App.currentUser.workAccess && currentConfig && currentConfig.length) {
            currentConfig.forEach(function (config) {
                var template = requireContent(config.template);
                var container = self.$el.find(config.selector);

                template = _.template(template);

                if (!container.find('#' + config.elementId).length) {
                    container[config.insertType](template({
                        elementId  : config.elementId,
                        translation: self.translation
                    }));
                }
            });
        } else {
            this.$el.find('.objectivesTopBtnBlockSmall').hide();
        }

        this.$el.find('.filesBlock').hide();
        this.setSelectedFiles();
        this.$el.find('#commentForm').on('submit', {
            body   : this.commentBody,
            context: this
        }, this.commentFormSubmit);
        this.$el.find('#fileThumbnail').hide();
        this.commentCollection = new CommentCollection({
            data: {
                objectiveId: this.model.get('_id'),
                context    : CONTENT_TYPES.ACHIEVEMENTFORM,
                reset      : true
            }
        });

        this.commentCollection.on('reset', this.renderComment, this);

        this.delegateEvents(this.events);

        return this;
    }
});
