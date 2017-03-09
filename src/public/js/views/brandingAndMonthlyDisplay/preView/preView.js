define([
    'backbone',
    'Underscore',
    'jQuery',
    'moment',
    'text!templates/brandingAndMonthlyDisplay/preview.html',
    'text!templates/brandingAndMonthlyDisplay/filePreView.html',
    'text!templates/objectives/comments/comment.html',
    'text!templates/objectives/comments/newRow.html',
    'collections/file/collection',
    'models/file',
    'models/comment',
    'views/baseDialog',
    'collections/comment/collection',
    'populate',
    'constants/otherConstants',
    'constants/levelConfig',
    'helpers/implementShowHideArabicInputIn',
    'dataService',
    'constants/contentType',
    'views/objectives/fileDialogView',
    'views/fileDialog/fileDialog',
    'constants/errorMessages'
], function (Backbone, _, $, moment, PreviewTemplate, FileTemplate, CommentTemplate, NewCommentTemplate,
             FileCollection, FileModel, CommentModel, BaseView, CommentCollection,
             populate, CONSTANTS, levelConfig, implementShowHideArabicInputIn, dataService,
             CONTENT_TYPES, FileDialogView, FileDialogPreviewView, ERROR_MESSAGES) {

    var PreviewView = BaseView.extend({
        contentType: CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY,

        template             : _.template(PreviewTemplate),
        commentTemplate      : _.template(CommentTemplate),
        newCommentTemplate   : _.template(NewCommentTemplate),
        fileTemplate         : _.template(FileTemplate),
        CONSTANTS            : CONSTANTS,
        ALLOWED_CONTENT_TYPES: _.union(CONSTANTS.IMAGE_CONTENT_TYPES, CONSTANTS.MS_WORD_CONTENT_TYPES, CONSTANTS.MS_EXCEL_CONTENT_TYPES, CONSTANTS.OTHER_FORMATS, CONSTANTS.VIDEO_CONTENT_TYPES),

        events: {
            'click #attachFiles'              : 'showAttachDialog',
            'click #sendComment'              : 'sendComment',
            'click .commentBottom .attachment': 'onShowFilesInComment',
            'click #showAllDescription'       : 'onShowAllDescriptionInComment',
            'click .masonryThumbnail'         : 'showFilePreviewDialog',
            'click #downloadFile'             : 'stopPropagation'
        },

        initialize: function (options) {
            this.translation = options.translation;
            this.model = options.model;
            this.files = new FileCollection();
            this.previewFiles = new FileCollection(this.model.get('attachments'), true);
            _.bindAll(this, 'fileSelected', 'renderComment');

            this.makeRender();
            this.render();
        },

        showFilePreviewDialog: function (e) {
            var $el = $(e.target);
            var $thumbnail = $el.closest('.masonryThumbnail');
            var fileModelId = $thumbnail.attr('data-id');
            var fileModel = this.previewFiles.get(fileModelId);
            var options = {
                fileModel  : fileModel,
                bucket     : 'competitors',
                translation: this.translation
            };
            if(!fileModel){
                fileModel = this.fileCollection.get(fileModelId);
                options = {
                    fileModel  : fileModel,
                    bucket     : 'comments',
                    translation: this.translation
                };
            }

            this.fileDialogView = new FileDialogPreviewView(options);
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

        showAttachDialog: function () {
            var self = this;

            this.fileDialogView = new FileDialogView({
                files      : this.files,
                dialogTitle: this.translation.dialogTitle,
                translation: this.translation,
                buttonName : this.translation.attachBtn
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
                        self.fileCollection;
                        if (err) {
                            return App.render(err);
                        }

                        $target.addClass('loadFile');
                        self.fileCollection = new FileCollection(filesCollection);
                        self.showFilesInComment($showFilesBlock, self.fileCollection.toJSON());
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

        sendComment: function () {
            var commentModel = new CommentModel();
            var self = this;
            this.commentBody = {
                commentText: this.$el.find('#commentInput').val(),
                objectiveId: this.model.get('_id'),
                context    : CONTENT_TYPES.COMPETITORBRANDING
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
                    context.$el.find('#commentWrapper').prepend(context.newCommentTemplate(
                        {
                            comment      : jsonComment,
                            translation  : this.translation,
                            notShowAttach: false
                        }
                    ));
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
            var self = this;
            dataService.getData(`${CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY}/${this.model.get('_id')}`, {}, (err, model) => {
                if (err) {
                    return App.renderErrors([ERROR_MESSAGES.readError]);
                }

                const currentLanguage = App.currentUser.currentLanguage;

                const categories = [];
                model.categories.map((category) => {
                    categories.push(category.name[currentLanguage]);
                });
                model.categoryString = categories.join(', ');
                model.descriptionString = model.description[currentLanguage];
                model.branchString = model.branch.name[currentLanguage];
                model.outletString = model.outlet.name[currentLanguage];
                model.displayTypeString = (model.displayType && model.displayType.length) ? model.displayType[0].name[currentLanguage] : '';
                model.dateStart = moment(model.dateStart).format('DD.MM.YYYY');
                model.dateEnd = moment(model.dateEnd).format('DD.MM.YYYY');
                model.countryString = (model.createdBy.country.length) ? model.createdBy.country[0].name[currentLanguage] : self.translation.missedData;
                model.regionString = (model.region) ? model.region.name[currentLanguage] : self.translation.missedData;
                model.subRegionString = (model.subRegion) ? model.subRegion.name[currentLanguage] : self.translation.missedData;

                model.createdBy.userName = `${model.createdBy.firstName[currentLanguage]} ${model.createdBy.lastName[currentLanguage]}`;

                var formString;

                formString = this.$el.html(this.template({
                    jsonModel  : model,
                    translation: self.translation
                }));

                self.$el = formString.dialog({
                    dialogClass  : 'create-dialog competitorBranding-dialog',
                    width        : '1000',
                    showCancelBtn: false,
                    buttons      : {
                        save: {
                            text : self.translation.okBtn,
                            class: 'btn saveBtn',
                            click: function () {
                                if (self.model.changedAttributes()) {
                                    self.trigger('modelChanged', self.model.get('comments').length || '');
                                }

                                self.undelegateEvents();
                                self.$el.dialog('close').dialog('destroy').remove();
                            }
                        }
                    },

                    close: function () {
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

                self.$el.find('#commentForm').on('submit', {
                    body   : self.commentBody,
                    context: self
                }, self.commentFormSubmit);
                self.$el.find('#fileThumbnail').hide();

                self.setSelectedFiles(model.attachments);

                self.commentCollection = new CommentCollection({
                    data: {
                        objectiveId: self.model.get('_id'),
                        context    : CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY,
                        reset      : true
                    }
                });

                self.commentCollection.on('reset', self.renderComment, self);

                self.delegateEvents(self.events);

                return self;
            });
        }
    });

    return PreviewView;
});
