define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var FileModel = require('models/file');
    var CategoryModel = require('models/category');
    var ERROR_MESSAGES = require('constants/errorMessages');
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
        },

        defineUIElements: function () {
            var view = this.$el;

            this.ui = {
                fileInput: view.find('#file-input')
            };
        },

        template: _.template(Template),

        events: {
            'click .category-table-item': 'handleCategoryClick',
            'click #add-file': 'handleAddFileClick',
            'change #file-input': 'handleFileSelected'
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
                    content = document.createElement('img');
                    content.src = '/preview/' + fileObj.preview;
                } else {
                    var fileModel = new FileModel();
                    var fileType = fileModel.getTypeFromContentType(file.type);

                    content = document.createElement('div');
                    content.className = 'iconThumbnail ' + fileType;
                }

                var fileThimbnail = _.template(FileThumbnailTemplate)({
                    _id: fileObj._id,
                    content: content,
                    fileName: fileObj.originalName,
                    date: fileObj.createBy.date
                });

                attachmentsContainer.append(fileThimbnail);
            });

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

            var newCategoryModel = new CategoryModel();
            newCategoryModel.uploadProductInformation(file);
            newCategoryModel.on('file-uploaded', function (response) {

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
