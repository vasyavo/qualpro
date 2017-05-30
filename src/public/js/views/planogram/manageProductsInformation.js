define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var moment = require('moment');
    var Backbone = require('backbone');
    var FileModel = require('models/file');
    var CategoryModel = require('models/category');
    var CONSTANTS = require('constants/otherConstants');
    var ERROR_MESSAGES = require('constants/errorMessages');
    var FullSizeFileOverview = require('views/fileDialog/fileDialog');
    var Template = require('text!templates/planogram/manage-products-information.html');
    var FileThumbnailTemplate = require('text!templates/planogram/file-thumbnail.html');

    return Backbone.View.extend({

        initialize: function (options) {
            this.translation = options.translation;
            this.categories = options.categories;
            this.ALLOWED_CONTENT_TYPES = _.union(
                CONSTANTS.IMAGE_CONTENT_TYPES,
                CONSTANTS.VIDEO_CONTENT_TYPES,
                CONSTANTS.MS_WORD_CONTENT_TYPES,
                CONSTANTS.MS_EXCEL_CONTENT_TYPES,
                CONSTANTS.MS_POWERPOINT_CONTENT_TYPES,
                CONSTANTS.OTHER_FORMATS
            );

            this.render();
            this.defineUIElements();

            this.ui.deleteButton.hide();
        },

        defineUIElements: function () {
            var view = this.$el;

            this.ui = {
                fileInput: view.find('#file-input'),
                deleteButton: view.find('#delete')
            };
        },

        template: _.template(Template),

        checkedFiles: [],

        events: {
            'click .category-table-item': 'handleCategoryClick',
            'click #add-file': 'handleAddFileClick',
            'change #file-input': 'handleFileSelected',
            'click .thumbnailBody': 'handleFileClick',
            'click .customCheckbox': 'handleFileCheckboxClick',
            'click #delete': 'handleDeleteButtonClick'
        },

        handleFileCheckboxClick: function (event) {
            var target = $(event.currentTarget);
            var fileId = target.attr('data-file-id');
            var checked = event.currentTarget.checked;

            if (checked) {
                this.checkedFiles.push(fileId);
            } else {
                var fileIdIndex = this.checkedFiles.findIndex(function (item) {
                    return item === fileId;
                });

                this.checkedFiles.splice(fileIdIndex, 1);
            }

            if (this.checkedFiles.length) {
                this.ui.deleteButton.show();
            } else {
                this.ui.deleteButton.hide();
            }
        },

        handleDeleteButtonClick: function () {
            if (confirm('Are you sure you want delete this files?')) {
                var that = this;
                var checkedFiles = this.checkedFiles;
                var categoryObject = this.categories.find(function (category) {
                    return category._id === that.workingCategory;
                });
                var arrayOfFilesId = categoryObject.information.filter(function (file) {
                    return !checkedFiles.includes(file._id);
                });

                var categoryModel = new CategoryModel();
                categoryModel.updateCategoryInformation(that.workingCategory, arrayOfFilesId);
                categoryModel.on('category-information-updated', function () {
                    categoryObject.information = categoryObject.information.filter(function (file) {
                        if (checkedFiles.includes(file._id)) {
                            that.$el.find('#file-thumbnail-' + file._id).remove();
                            return false;
                        } else {
                            return true;
                        }
                    });

                    that.checkedFiles = [];
                    that.ui.deleteButton.hide();
                });
            }
        },

        handleFileClick: function (event) {
            var that = this;
            var target = $(event.currentTarget);
            var fileId = target.attr('data-file-id');
            var fileModel = new FileModel({
                _id: fileId
            });
            fileModel.id = fileId;

            this.fullSizeFileOverview = new FullSizeFileOverview({
                fileModel  : fileModel,
                translation: this.translation
            });
            this.fullSizeFileOverview.on('download', function (options) {
                var url = options.url;
                var originalName = options.originalName;
                var attachmentsContainer = that.$el.find('.attachments');

                attachmentsContainer.append('<a id="download-file" class="hidden" href="' + url + '" download="' + originalName + '"></a>');

                var fileElement = attachmentsContainer.find('#download-file');
                fileElement[0].click();
                fileElement.remove();
            });
        },

        handleCategoryClick: function (event) {
            var that = this;
            var target = $(event.target);
            var categoryId = target.attr('data-category-id');
            var categoryObject = this.categories.find(function (category) {
                return category._id === categoryId;
            });
            var files = categoryObject.information || [];
            var attachmentsContainer = that.$el.find('.attachments');

            attachmentsContainer.html('');

            files.forEach(function (fileObj) {
                var content;

                if (/image/.test(fileObj.contentType)) {
                    if (fileObj.new) {
                        content = fileObj.content;
                    } else {
                        content = '<img src="preview/' + fileObj.preview + '">';
                    }
                } else {
                    var fileModel = new FileModel();
                    var fileType = fileModel.getTypeFromContentType(fileObj.contentType);

                    content = '<div class="iconThumbnail ' + fileType + '"></div>';
                }

                var fileThimbnail = _.template(FileThumbnailTemplate)({
                    _id: fileObj._id,
                    content: content,
                    fileName: fileObj.originalName,
                    date: moment.utc(fileObj.createdBy.date).format('DD.MM.YYYY')
                });

                attachmentsContainer.append(fileThimbnail);
            });

            this.ui.deleteButton.hide();

            this.checkedFiles = [];

            this.workingCategory = categoryId;
        },

        handleAddFileClick: function () {
            this.ui.fileInput.click();
        },

        handleFileSelected: function (event) {
            var that = this;
            var currentLanguage = App.currentUser.currentLanguage;
            var file = event.target.files[0];

            if (!file) {
                return App.render({
                    type : 'error',
                    message : ERROR_MESSAGES.fileNotSelected[currentLanguage]
                });
            }

            if (that.ALLOWED_CONTENT_TYPES.indexOf(file.type) === -1) {
                return App.render({
                    type: 'error',
                    message: ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage]
                });
            }

            var fileModel = new FileModel();
            fileModel.uploadFile(file);
            fileModel.on('file-uploaded', function (response) {
                var uploadedFileId = response.files[0]._id;
                var categoryObject = that.categories.find(function (category) {
                    return category._id === that.workingCategory;
                });
                var arrayOfFilesId = categoryObject.information.map(function (fileObj) {
                    return fileObj._id;
                });
                arrayOfFilesId.push(uploadedFileId);

                var categoryModel = new CategoryModel();
                categoryModel.updateCategoryInformation(that.workingCategory, arrayOfFilesId);
                categoryModel.on('category-information-updated', function () {
                    var fileReader = new FileReader();
                    fileReader.readAsDataURL(file);
                    fileReader.onload = function (event) {
                        var content;

                        if (/image/.test(file.type)) {
                            var fileAsBase64String = event.target.result;

                            content = '<img src="' + fileAsBase64String + '">';
                        } else {
                            var fileModel = new FileModel();
                            var fileType = fileModel.getTypeFromContentType(file.type);

                            content = '<div class="iconThumbnail ' + fileType + '"></div>';
                        }

                        var fileCreationDate = moment().format('DD.MM.YYYY');

                        categoryObject.information.push({
                            _id: uploadedFileId,
                            content: content,
                            originalName: file.name,
                            contentType: file.type,
                            createdBy: {
                                date: fileCreationDate
                            },
                            new: true
                        });

                        var fileThumbnail = _.template(FileThumbnailTemplate)({
                            _id: uploadedFileId,
                            content: content,
                            fileName: file.name,
                            date: fileCreationDate
                        });

                        that.$el.find('.attachments').append(fileThumbnail);
                    };
                });
            });
        },

        render: function () {
            var that = this;

            var layout = this.template({
                translation: this.translation,
                currentLanguage: App.currentUser.currentLanguage,
                categories: this.categories
            });

            this.$el = $(layout).dialog({
                width : 'auto',
                dialogClass : 'self-share-dialog',
                showCancelBtn: false,
                buttons : {
                    save : {
                        text : that.translation.close,
                        click : function () {
                            that.$el.dialog('close').dialog('destroy').remove();
                        }
                    }
                }
            });

            this.delegateEvents(this.events);
        }

    });

});
