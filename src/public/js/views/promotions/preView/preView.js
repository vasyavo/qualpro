var $ = require('jquery');
var _ = require('underscore');
var PreviewTemplate = require('../../../../templates/promotions/preview.html');
var FileTemplate = require('../../../../templates/file/preView.html');
var FileCollection = require('../../../collections/file/collection');
var FileModel = require('../../../models/file');
var PromotionsModel = require('../../../models/promotions');
var BaseView = require('../../../views/baseDialog');
var populate = require('../../../populate');
var CONSTANTS = require('../../../constants/otherConstants');
var LEVEL_CONFIG = require('../../../constants/levelConfig');
var dataService = require('../../../dataService');
var CONTENT_TYPES = require('../../../constants/contentType');
var FileDialogView = require('../../../views/objectives/fileDialogView');
var PromotionsItemsView = require('../../../views/promotions/promotionsItemsView');
var FileDialogPreviewView = require('../../../views/fileDialog/fileDialog');
var CommentTemplate = require('../../../../templates/objectives/comments/comment.html');
var NewCommentTemplate = require('../../../../templates/objectives/comments/newRow.html');
var CommentModel = require('../../../models/comment');
var CommentCollection = require('../../../collections/comment/collection');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var App = require('../../../appState');

module.exports = BaseView.extend({
    contentType          : CONTENT_TYPES.PROMOTIONS,
    template             : _.template(PreviewTemplate),
    commentTemplate      : _.template(CommentTemplate),
    newCommentTemplate   : _.template(NewCommentTemplate),
    fileTemplate         : _.template(FileTemplate),
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
        'click #attachFiles'              : 'showAttachDialog',
        'click #sendComment'              : 'sendComment',
        'click .commentBottom .attachment': 'onShowFilesInComment',
        'click #showAllDescription'       : 'onShowAllDescriptionInComment',
        'click #edit'                     : 'editPromotion',
        'click #duplicate'                : 'duplicatePromotion',
        'click #promotionsItems'          : 'promotionsItems',
        'click .masonryThumbnail'         : 'showFilePreviewDialog',
        'click #goToBtn'                  : 'goTo',
        'click #downloadFile'             : 'stopPropagation'
    },

    initialize: function (options) {

        this.activityList = options.activityList;
        this.translation = options.translation;
        this.model = options.model;
        this.previewFiles = new FileCollection(this.model.get('attachments'), true);
        this.files = new FileCollection();
        _.bindAll(this, 'fileSelected', 'renderComment');

        this.makeRender();
        this.render();
    },

    showAttachDialog: function () {
        var self = this;

        this.fileDialogView = new FileDialogView({
            files      : this.files,
            dialogTitle: this.translation.commentAttachments,
            buttonName : this.translation.attachBtn,
            translation: this.translation
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

    fileSelected: function (e) {
        var self = this;
        var data = e.data;
        var $fileInput = $(data.fileInput);
        var fileCid = $fileInput.attr('id');
        var fileModel = this.files.get(fileCid);
        var reader = new FileReader();
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

        reader.readAsDataURL(e.target.files[0]);

        reader.onload = function (el) {
            var result = el.target.result;
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
        var fileModel = new FileModel({silent: true});

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

    onShowAllDescriptionInComment: function (e) {
        var $target = $(e.target);
        var $descriptionBlock = $target.closest('.commentDescription').find('#commentBody');

        $descriptionBlock.toggleClass('showAllDescription');
    },

    sendComment: _.debounce(function () {
        var commentModel = new CommentModel();
        var self = this;

        this.commentBody = {
            commentText: this.$el.find('#commentInput').val(),
            objectiveId: this.model.get('_id'),
            context    : CONTENT_TYPES.PROMOTIONS
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
                context.chengeCountOfAttachedFilesToComment('');

                if (context.commentCollection.length === 1) {
                    context.$el.find('.objectivesPaddingBlock').show();
                }
            }
        });

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

    editPromotion: function () {
        this.off('change');
        this.$el.dialog('destroy');
        this.trigger('showEditPromotionDialog', this.model);
    },

    duplicatePromotion: function () {
        var jsonModel = this.model.toJSON();
        var model;

        delete jsonModel._id;
        delete jsonModel.attachments;
        jsonModel.status = CONSTANTS.PROMOTION_STATUSES.DRAFT;

        model = new PromotionsModel(jsonModel);

        this.trigger('showEditPromotionDialog', model, true);
        this.$el.dialog('close').dialog('destroy').remove();
    },

    promotionsItems: function () {
        var id = this.model.id;

        this.promotionsItemsView = new PromotionsItemsView({
            promotion  : id,
            translation: this.translation
        });
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

    setSelectedFiles: function (files) {
        var self = this;
        var $fileContainer = self.$el.find('#objectiveFileThumbnail');

        if (files.length) {
            self.$el.find('.filesBlock').show();
        }

        $fileContainer.html('');

        files.forEach(function (file) {
            $fileContainer.append(self.fileTemplate({
                model: file
            }));
        });
        App.masonryGrid.call(self.$el);
    },

    render: function () {
        var jsonModel = this.model.toJSON();
        var formString;
        var self = this;
        var currentConfig = this.activityList ? LEVEL_CONFIG[this.contentType].activityList.preview : LEVEL_CONFIG[this.contentType]['1'].preview;

        if (jsonModel.status._id === 'expired') {
            currentConfig = LEVEL_CONFIG[this.contentType]['2'].preview;
        }

        formString = this.$el.html(this.template({
            jsonModel   : jsonModel,
            translation : this.translation,
            activityList: this.activityList
        }));

        this.$el = formString.dialog({
            dialogClass  : 'create-dialog competitorBranding-dialog',
            title        : this.translation.preViewTitle,
            width        : '1000',
            showCancelBtn: false,
            buttons      : {
                save: {
                    text : this.translation.okBtn,
                    class: 'btn saveBtn',
                    click: function () {
                        if (self.model.changedAttributes()) {
                            self.trigger('modelChanged', self.model.get('comments') ? self.model.get('comments').length : '');
                        }
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

        this.$el.find('#commentForm').on('submit', {
            body   : this.commentBody,
            context: this
        }, this.commentFormSubmit);
        this.$el.find('#fileThumbnail').hide();

        if (App.currentUser.workAccess) {
            currentConfig.forEach(function (config) {
                var template = require('../../../../' + config.template);
                var container = self.$el.find(config.selector);

                template = _.template(template);

                if (!container.find('#' + config.elementId).length) {
                    container[config.insertType](template({
                        elementId  : config.elementId,
                        translation: self.translation
                    }));
                }
            });
        }

        this.setSelectedFiles(jsonModel.attachments);

        this.commentCollection = new CommentCollection({
            data: {
                objectiveId: this.model.get('_id'),
                context    : CONTENT_TYPES.PROMOTIONS,
                reset      : true
            }
        });

        this.commentCollection.on('reset', this.renderComment, this);

        this.delegateEvents(this.events);

        return this;
    }
});
