define([
    'backbone',
    'jQuery',
    'Underscore',
    'views/baseDialog',
    'text!templates/file/preView.html',
    'text!templates/marketingCampaign/marketingCampaignItem/commentDialog.html',
    'text!templates/objectives/comments/comment.html',
    'text!templates/objectives/comments/newRow.html',
    'collections/comment/collection',
    'models/comment',
    'models/file',
    'constants/otherConstants',
    'collections/file/collection',
    'constants/contentType',
    'constants/errorMessages',
    'views/objectives/fileDialogView',
    'views/fileDialog/fileDialog'

], function (Backbone, $, _, BaseDialog, FilePreviewTemplate, CommentViewTemplate, CommentTemplate,
             NewCommentTemplate, CommentCollection, CommentModel, FileModel, CONSTANTS,
             FileCollection, CONTENT_TYPES, ERROR_MESSAGES, FileDialogView, FileDialogPreviewView) {

    var CommentView = BaseDialog.extend({
        contentType        : CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM,
        filePreviewTemplate: _.template(FilePreviewTemplate),
        commentViewTemplate: _.template(CommentViewTemplate),
        commentTemplate    : _.template(CommentTemplate),
        newCommentTemplate : _.template(NewCommentTemplate),

        events: {
            'click .masonryThumbnail': 'showFilePreviewDialog',
            'click #viewComments'    : 'showComments',
            'click #sendComment'     : 'sendComment',
            'click #attachFiles'     : 'showAttachDialog',
            'click #downloadFile'    : 'stopPropagation',
            'click #showAllDescription': 'onShowAllDescriptionInComment'
        },

        initialize: function (options) {
            var self = this;
            this.brandingItemId = options.id;
            this.currentLanguage = App.currentUser.currentLanguage;
            this.translation = options.translation;
            this.newFileCollection = new FileCollection();
            this.ALLOWED_CONTENT_TYPES = _.union(
                CONSTANTS.IMAGE_CONTENT_TYPES,
                CONSTANTS.VIDEO_CONTENT_TYPES,
                CONSTANTS.MS_WORD_CONTENT_TYPES,
                CONSTANTS.MS_EXCEL_CONTENT_TYPES,
                CONSTANTS.MS_POWERPOINT_CONTENT_TYPES,
                CONSTANTS.OTHER_FORMATS
            );

            this.collection = new CommentCollection({
                data: {
                    objectiveId    : this.brandingItemId,
                    reset          : true,
                    context        : this.contentType,
                    withAttachments: true
                }
            });

            this.makeRender();

            this.collection.on('reset', function () {
                self.collection.changeUrl(false);
                self.render();
            });
            _.bindAll(this, 'render');
        },

        showFilePreviewDialog: _.debounce(function (e) {
            var $el = $(e.target);
            var $thumbnail = $el.closest('.masonryThumbnail');
            var fileModelId = $thumbnail.attr('data-id');
            var fileModel = this.files.get(fileModelId);

            this.fileDialogView = new FileDialogPreviewView({
                fileModel: fileModel,
                bucket   : CONTENT_TYPES.COMMENT
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

        preventDefaults: function (e) {
            e.preventDefault();
            e.stopPropagation();
        },

        showFilesInComment: function (options) {
            var self = this;
            var $place = options.place;
            var files = options.files;
            var type = options.type;

            files.forEach(function (file) {
                if (type === 'prepend') {
                    $place[type]('<div class="displayComments" id="userName">' + file.userName + '</div>');
                }
                $place[type](self.filePreviewTemplate({
                    model: file
                }));
                if (type === 'append') {
                    $place[type]('<div class="displayComments" id="userName">' + file.userName + '</div>');
                }

            });
        },

        showAttachDialog: function () {
            var self = this;

            this.fileDialogView = new FileDialogView({
                files      : this.newFileCollection,
                translation: this.translation,
                title      : this.translation.attachTitle,
                buttonName : this.translation.attachButtonName
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
            this.newFileCollection.remove(file, {silent: true});
            this.$el.find('#' + file.cid).remove();
        },

        fileSelected: function (e) {
            var self = e.data.context;
            var data = e.data;
            var $fileInput = $(data.fileInput);
            var fileCid = $fileInput.attr('id');
            var fileModel = self.newFileCollection.get(fileCid);
            var reader = new FileReader();

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
                    App.render({type: 'error', message: ERROR_MESSAGES.forbiddenTypeOfFile[self.currentLanguage]});
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

        attachFile: function () {
            var fileInput;
            var fileModel = new FileModel();

            this.newFileCollection.add(fileModel);
            this.$el.find('#commentForm').append('<input type="file" accept="' + this.ALLOWED_CONTENT_TYPES.join(', ') + '" name="' + fileModel.cid + '" id="' + fileModel.cid + '" style="display: none">');
            fileInput = this.$el.find('#' + fileModel.cid);
            fileInput.on('change', {fileInput: fileInput, context: this}, this.fileSelected);
            fileInput.click();
        },

        sendComment: _.debounce(function () {
            var commentModel = new CommentModel();
            var self = this;

            this.commentBody = {
                commentText: this.$el.find('#commentInput').val(),
                objectiveId: this.brandingItemId,
                context    : this.contentType
            };

            commentModel.setFieldsNames(this.translation);

            commentModel.validate(this.commentBody, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    self.checkForEmptyInput(self.newFileCollection, self.$el);
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
                url        : context.collection.url,
                type       : 'POST',
                data       : data,
                contentType: false,
                processData: false,
                success    : function (comment) {
                    var commentModel = new CommentModel(comment, {parse: true});
                    var jsonComment = commentModel.toJSON();
                    var $fileHolder = context.$el.find('#objectiveFileThumbnail');
                    var options;

                    context.collection.add(commentModel);
                    context.$el.find('#commentWrapper').prepend(context.newCommentTemplate({
                        comment      : jsonComment,
                        translation  : context.translation,
                        notShowAttach: true
                    }));
                    context.$el.find('#commentInput').val('');
                    context.files.reset([]);
                    context.$el.find('#commentForm').html('');

                    if (context.collection.length === 1) {
                        context.$el.find('.objectivesPaddingBlock').show();
                    }

                    if (jsonComment.attachments && jsonComment.attachments.length) {
                        context.files.add(jsonComment.attachments);
                        options = {
                            place: $fileHolder,
                            files: jsonComment.attachments,
                            type : 'prepend'
                        };
                        context.showFilesInComment(options);
                    }
                    context.newFileCollection = new FileCollection();
                }
            });

        },

        onShowAllDescriptionInComment: function (e) {
            var $target = $(e.target);
            var $descriptionBlock = $target.closest('.commentDescription').find('#commentBody');

            $descriptionBlock.toggleClass('showAllDescription');
        },

        render: function () {
            var self = this;
            var $commentWrapper;
            var $commentScrollableContainer;
            var jsonCollection = this.collection.toJSON();
            var commentFiles = [];
            var $fileHolder;
            var options;
            var $formString = $(this.$el);
            _.map(jsonCollection, function (element) {
                if (element.attachments && element.attachments.length) {
                    commentFiles = _.union(commentFiles, element.attachments);
                }
            });
            this.files = new FileCollection(commentFiles);


            $formString.html(this.commentViewTemplate({
                collection : jsonCollection,
                translation: this.translation
            }));

            this.$el = $formString.dialog({
                dialogClass  : 'create-dialog',
                width        : '1000',
                showCancelBtn: false,
                buttons      : {
                    save: {
                        text : self.translation.okBtn,
                        class: 'btn saveBtn objectiveClose',
                        click: function () {
                            self.undelegateEvents();
                            self.$el.dialog('close').dialog('destroy').remove();
                        }
                    }
                }
            });

            $fileHolder = this.$el.find('#objectiveFileThumbnail');

            if (commentFiles.length) {
                options = {
                    place: $fileHolder,
                    files: commentFiles,
                    type : 'append'
                };
                this.showFilesInComment(options);
            }
            $commentWrapper = this.$el.find('#commentWrapper');
            $commentScrollableContainer = $commentWrapper.closest('.innerScroll');

            if (jsonCollection.length) {
                $commentScrollableContainer.show();
            }

            $commentWrapper.html(this.commentTemplate({
                collection   : jsonCollection,
                translation  : this.translation,
                notShowAttach: true
            }));

            this.$el.find('#commentForm').on('submit', {
                body   : this.commentBody,
                context: this
            }, this.commentFormSubmit);

            this.$el.find('#showFilesBlock').addClass();

            return this;
        }
    });

    return CommentView;

});
