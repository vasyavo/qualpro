define([
    'Backbone',
    'Underscore',
    'jQuery',
    'views/fileDialog/fileDialog',
    'text!templates/objectives/fileDialogView.html',
    'text!templates/objectives/fileDialogView/header.html',
    'text!templates/objectives/fileDialogView/thumbnail.html',
    'collections/file/collection',
    'constants/otherConstants',
    'views/baseDialog',
    'constants/errorMessages'
], function (Backbone, _, $, FileDialogView, FileDialogViewTemplate, HeaderTemplate, ThumbnailTemplate,
             FileCollection, OtherConstants, BaseView, ERROR_MESSAGES) {
    'use strict';

    var CreateView = BaseView.extend({
        template         : _.template(FileDialogViewTemplate),
        headerTemplate   : _.template(HeaderTemplate),
        thumbnailTemplate: _.template(ThumbnailTemplate),

        events: {
            'click #attachButton'            : 'attachFile',
            'click #addFile'                 : 'addFIle',
            'click #removeFile'              : 'removeFile',
            'click #thumbnails .thumbnail_js': 'showFilePreviewDialog',
            'click #downloadFile'            : 'stopPropagation'
        },

        initialize: function (options) {
            options = options || {};
            this.translation = options.translation;
            this.buttonName = options.buttonName || this.translation.attach;
            this.dialogTitle = options.dialogTitle;
            this.contentType = options.contentType || 'objectives';
            this.files = options.files;
            this.haveParent = options.haveParent;
            this.title = options.title || 'Objective files';
            this.selectOne = options.selectOne;
            this.rightTitle = options.rightTitle;

            this.makeRender();
            this.render();
            this.setSelectedFiles();

            if (this.haveParent) {
                this.setParentFiles();
            }

            this.on('fileSelected', this.fileSelected, this);
        },

        showFilePreviewDialog: function (e) {
            var $el = $(e.target);
            var $thumbnail = $el.closest('.thumbnail');
            var fileModelCid = $thumbnail.attr('data-id');
            var fileModel = this.files.get(fileModelCid);
            this.fileDialogView = new FileDialogView({
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
        },

        getPreview: function (file) {
            var preview = file.preview || file.type || file.get('preview');

            if (preview) {
                return preview;
            }

            return this.getTypeFromContentType(file.get('contentType'));
        },

        removeFile: function (e) {
            var $el = $(e.target);
            var $thumbnail = $el.closest('.thumbnail');
            var id = $thumbnail.attr('data-id');
            var cid = id;
            var file = this.files.get(id) || this.files.get(cid);
            var preview = this.getPreview(file);
            var type;

            $thumbnail.remove();

            file.set({selected: false});

            if (file.get('contentType')) {

                this.$el.find('#parentThumbnails').append(this.thumbnailTemplate({
                    name     : file.get('originalName') || file.get('name'),
                    type     : file.get('type'),
                    preview  : preview,
                    iconClass: 'arrowRight',
                    iconId   : 'addFile',
                    cid      : file.get('_id') || file.get('cid')
                }));
            }
            file.url = 'objectives/file';

            this.trigger('removeFile', file);
            App.masonryGrid.call(this.$el, null, '.masonryThumbnailsWrapperSecond');
        },

        addFIle: function (e) {
            var $el = $(e.target);
            var $thumbnail = $el.closest('.thumbnail');
            var cid = $thumbnail.attr('data-id');
            var canAdd = true;
            var currentLanguage = App.currentUser.currentLanguage;
            var preview;
            var file;
            this.files.forEach(function (file) {
                if (!file.get('uploaded')) {
                    canAdd = false;
                }
            });

            file = canAdd ? this.files.get(cid) : null;
            if (file) {
                preview = this.getPreview(file);

                if (this.selectOne && (this.files.getSelected({selected: true}).length || this.files.getUploaded({uploaded: false}).length)) {
                    App.render({type: 'error', message: ERROR_MESSAGES.onlyOneDocumentAttach[currentLanguage]});
                    return false;
                }

                file.set({selected: true});
                $thumbnail.remove();

                this.$el.find('#thumbnails').append(this.thumbnailTemplate({
                    name     : file.get('originalName') || file.get('name'),
                    iconClass: 'arrowLeft',
                    iconId   : 'removeFile',
                    type     : file.get('type'),
                    preview  : preview,
                    cid      : file.get('_id')
                }));

                this.trigger('addFile', file);
            }
        },

        setParentFiles: function () {
            this.checkForEmptyInput(this.files, this.$el);
            var parentFiles = this.files.getParent({parent: true});
            var parentUnSelectedFiles = this.files.getSelected({models: parentFiles, selected: false});
            var self = this;

            parentUnSelectedFiles.forEach(function (parentFile) {
                parentFile = parentFile.toJSON();
                var preview = self.getPreview(parentFile);

                self.$el.find('#parentThumbnails').append(self.thumbnailTemplate({
                    name     : parentFile.originalName || parentFile.name,
                    iconId   : 'addFile',
                    iconClass: 'arrowRight',
                    type     : parentFile.type,
                    preview  : preview,
                    cid      : parentFile.cid || parentFile._id
                }));
            });

            App.masonryGrid.call(this.$el, null, '.masonryThumbnailsWrapperSecond');
        },

        setSelectedFiles: function () {
            var self = this;
            var files;
            this.checkForEmptyInput(this.files, this.$el);

            if (this.haveParent) {
                files = this.files.getSelected({selected: true});
            } else {
                files = this.files;
            }

            files.forEach(function (file) {
                var iconClass = '';
                var createdBy = file.createdBy;
                var preview = self.getPreview(file);

                if (createdBy && self.haveParent) {
                    iconClass = 'arrowLeft';
                }

                self.$el.find('#thumbnails').append(self.thumbnailTemplate({
                    name     : file.get('originalName') || file.get('name'),
                    type     : file.get('type'),
                    iconClass: iconClass,
                    cid      : file.cid || file.get('_id'),
                    preview  : preview || file.get('type')
                }));
            });
            this.files.forEach(function (file) {
                if (file.get('uploaded')) {
                    return;
                }
                var iconClass = '';
                var preview = self.getPreview(file);

                self.$el.find('#thumbnails').append(self.thumbnailTemplate({
                    name     : file.get('originalName') || file.get('name'),
                    type     : file.get('type'),
                    iconClass: iconClass,
                    cid      : file.cid || file.get('_id'),
                    preview  : preview || file.get('type')
                }));
            });

            App.masonryGrid.call(this.$el, null, '.masonryThumbnailsWrapperSecond');
        },

        fileSelected: function (fileModel) {
            var preview = this.getPreview(fileModel);
            this.$el.find('#thumbnails').append(this.thumbnailTemplate({
                name   : fileModel.get('originalName') || fileModel.get('name'),
                type   : fileModel.get('type'),
                cid    : fileModel.cid,
                preview: preview
            }));

            App.masonryGrid.call(this.$el, null, '.masonryThumbnailsWrapperSecond');
        },

        attachFile: function () {
            var currentLanguage = App.currentUser.currentLanguage;
            if (this.selectOne && this.files.getSelected({selected: true}).length) {
                App.render({type: 'error', message: ERROR_MESSAGES.onlyOneDocumentAttach[currentLanguage]});
                return false;
            }

            this.trigger('clickAttachFileButton');
        },

        render: function () {
            var $formString = $(this.template({
                translation: this.translation
            }));
            var self = this;
            var onBeforeClose = function () {
                self.trigger('fileDialogClosed');
            };

            if (this.dialogTitle) {
                $formString.find('#thumbnailsWrap').append(this.headerTemplate({
                    buttonName : this.buttonName,
                    parent     : this.haveParent,
                    title      : this.dialogTitle,
                    translation: this.translation
                }));
            } else {
                $formString.find('#thumbnailsWrap').append(this.headerTemplate({
                    buttonName : this.buttonName,
                    parent     : this.haveParent,
                    title      : this.title,
                    translation: this.translation
                }));
            }

            if (this.haveParent) {
                $formString.find('#thumbnailsWrap').append(this.headerTemplate({
                    buttonName : this.buttonName,
                    parent     : false,
                    title      : this.rightTitle || 'Sub objective files',
                    translation: this.translation
                }));
            }

            this.$el = $formString.dialog({
                dialogClass  : 'create-dialog full-height-dialog',
                width        : '1050',
                showCancelBtn: false,
                buttons      : {
                    save: {
                        text : self.translation.okBtn,
                        click: function () {
                            $(this).dialog('close').dialog('destroy').remove();
                        }
                    }
                }
            });

            $formString.dialog({
                beforeClose: this.beforeClose || onBeforeClose
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;
});
