var _ = require('underscore');
var $ = require('jquery');
var moment = require('moment');
var PreviewTemplate = require('../../../../templates/brandingAndMonthlyDisplay/preview.html');
var FileTemplate = require('../../../../templates/brandingAndMonthlyDisplay/filePreView.html');
var CommentTemplate = require('../../../../templates/objectives/comments/comment.html');
var NewCommentTemplate = require('../../../../templates/objectives/comments/newRow.html');
var FileCollection = require('../../../collections/file/collection');
var FileModel = require('../../../models/file');
var CommentModel = require('../../../models/comment');
var BaseView = require('../../../views/baseDialog');
var CommentCollection = require('../../../collections/comment/collection');
var populate = require('../../../populate');
var CONSTANTS = require('../../../constants/otherConstants');
var levelConfig = require('../../../constants/levelConfig');
var implementShowHideArabicInputIn = require('../../../helpers/implementShowHideArabicInputIn');
var dataService = require('../../../dataService');
var CONTENT_TYPES = require('../../../constants/contentType');
var FileDialogView = require('../../../views/objectives/fileDialogView');
var FileDialogPreviewView = require('../../../views/fileDialog/fileDialog');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var EditView = require('../../../views/brandingAndMonthlyDisplay/edit');
var BrandingAndMonthlyDislpayModel = require('../../../models/brandingAndMonthlyDisplay');
var INFO_MESSAGES = require('../../../constants/infoMessages');
var App = require('../../../appState');
var requireContent = require('../../../helpers/requireContent');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY,

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
        'click .masonryThumbnail'         : 'showFilePreviewDialog',
        'click #downloadFile'             : 'stopPropagation',
        'click #edit': 'showEditView',
        'click #delete': 'deleteBrandingAndMonthlyDisplay',
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

    showEditView: function () {
        var that = this;

        this.editView = new EditView({
            translation: this.translation,
            editableModel: this.model.toJSON(),
        });

        this.editView.on('edit-branding-and-monthly-display', function (data, brandingAndMonthlyDisplay) {
            var model = new BrandingAndMonthlyDislpayModel();

            model.edit(brandingAndMonthlyDisplay, data);

            model.on('branding-and-monthly-display-edited', function (response) {
                var view = that.$el;

                response.dateStart = moment.utc(response.dateStart).format('DD.MM.YYYY');
                response.dateEnd = moment.utc(response.dateEnd).format('DD.MM.YYYY');
                that.model.set(response, {merge: true});

                if (data.dateStart) {
                    view.find('#date-start').html(moment.utc(data.dateStart).format('DD.MM.YYYY'));
                }

                if (data.dateEnd) {
                    view.find('#date-end').html(moment.utc(data.dateEnd).format('DD.MM.YYYY'));
                }

                var displayTypeString = response.displayType.map(function (item) {
                    return item.name[App.currentUser.currentLanguage];
                }).join(', ');

                view.find('#display-type').html(displayTypeString);
                view.find('#description').html(data.description[App.currentUser.currentLanguage]);

                that.editView.$el.dialog('close').dialog('destroy').remove();

                that.trigger('update-list-view');
            });
        });
    },

    deleteBrandingAndMonthlyDisplay: function () {
        if (confirm(INFO_MESSAGES.confirmDeleteBrandingAndMonthlyReport[App.currentUser.currentLanguage])) {
            var that = this;
            var model = new BrandingAndMonthlyDislpayModel();

            model.delete(this.model.get('_id'));

            model.on('branding-and-monthly-display-deleted', function () {
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
        var options = {
            fileModel  : fileModel,
            bucket     : 'competitors',
            translation: this.translation,
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
    }, 1000, true),

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

    sendComment: _.debounce(function () {
        var commentModel = new CommentModel();
        var self = this;
        this.commentBody = {
            commentText: this.$el.find('#commentInput').val(),
            objectiveId: this.model.get('_id'),
            context    : CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY
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
        var currentConfig;

        if (this.activityList) {
            currentConfig = levelConfig[this.contentType].activityList.preview;
        } else {
            currentConfig = levelConfig[this.contentType][App.currentUser.accessRole.level] ? levelConfig[this.contentType][App.currentUser.accessRole.level].preview : [];
        }

        dataService.getData(CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY + '/' + this.model.get('_id'), {}, function(err, model) {
            if (err) {
                return App.renderErrors([ERROR_MESSAGES.readError]);
            }

            const currentLanguage = App.currentUser.currentLanguage;

            const categories = [];
            model.categories.map(function(category) {
                categories.push(category.name[currentLanguage]);
            });
            model.categoryString = categories.join(', ');
            model.descriptionString = model.description[currentLanguage];
            model.branchString = model.branch.name[currentLanguage];
            model.outletString = model.outlet.name[currentLanguage];
            model.retailSegmentString = model.retailSegment.name[currentLanguage];
            model.displayTypeString = (model.displayType && model.displayType.length) ? model.displayType.map(function(item) {
                return item.name[currentLanguage];
            }).join(',') : '';
            model.dateStart = moment.utc(model.dateStart).format('DD.MM.YYYY');
            model.dateEnd = moment.utc(model.dateEnd).format('DD.MM.YYYY');
            model.countryString = (model.createdBy.country.length) ? model.createdBy.country[0].name[currentLanguage] : self.translation.missedData;
            model.regionString = (model.region) ? model.region.name[currentLanguage] : self.translation.missedData;
            model.subRegionString = (model.subRegion) ? model.subRegion.name[currentLanguage] : self.translation.missedData;

            model.createdBy.userName = model.createdBy.firstName[currentLanguage] + ' ' + model.createdBy.lastName[currentLanguage];

            var formString;

            formString = self.$el.html(self.template({
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
