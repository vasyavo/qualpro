define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var lodash = require('lodash');
    var shortId = require('shortId');
    var Backbone = require('backbone');
    var CONSTANTS = require('constants/otherConstants');
    var ERROR_MESSAGES = require('constants/errorMessages');
    var Template = require('text!templates/objectives/visibilityForm/edit.html');
    var FileThumbnailTemplate = require('text!templates/objectives/visibilityForm/file-thumbnail.html');
    var NewFileThumbnailTemplate = require('text!templates/objectives/visibilityForm/new-file-thumbnail.html');

    return Backbone.View.extend({

        initialize: function (options) {
            this.translation = options.translation;
            this.allowedFileTypes = CONSTANTS.IMAGE_CONTENT_TYPES.concat(CONSTANTS.VIDEO_CONTENT_TYPES);

            this.templateOptions = {
                translation: this.translation,
                description: options.description,
                locationString: options.locationString,
                outlets: options.outlets,
                allowed : this.allowedFileTypes.join(', ')
            };

            this.render();
            this.defineUIElements();
        },

        defineUIElements: function () {
            var view = this.$el;

            this.ui = {
                fileInput: view.find('#file-input'),
            };
        },

        template: _.template(Template),

        selectedFiles: [],

        events: {
            'click .select-file': 'handleSelectFileClick',
            'change #file-input': 'handleFileSelected',
            'click #apply-to-all': 'handleClickApplyToAll',
            'click .remove-attachment': 'handleDeleteFileClick',
        },

        handleClickApplyToAll: function (event) {
            var that = this;
            var target = event.target;
            var checked = target.checked;
            var selectedFiles = this.selectedFiles;
            var attachmentsContainers = this.$el.find('.attachments-container');

            if (checked) {
                if (!selectedFiles.length) {
                    target.checked = false;

                    return App.renderErrors([
                        ERROR_MESSAGES.fileNotSelected[App.currentUser.currentLanguage]
                    ]);
                }

                if (lodash.uniqBy(selectedFiles, 'branchId').length > 1) {
                    target.checked = false;

                    return App.renderErrors([
                        ERROR_MESSAGES.selectFileOnlyForOneBranch[App.currentUser.currentLanguage]
                    ]);
                }

                attachmentsContainers.html('');

                selectedFiles.forEach(function (fileObject) {
                    var fileThumbnail = _.template(FileThumbnailTemplate)(fileObject);

                    attachmentsContainers.append(fileThumbnail);
                });

                this.$el.find('.remove-attachment').hide();

                this.applyToAll = true;
            } else {
                attachmentsContainers.each(function () {
                    var fileContainer = $(this);
                    var branchId = fileContainer.attr('data-branch-id');

                    var newFileThumbnail = _.template(NewFileThumbnailTemplate)({
                        branchId: branchId
                    });

                    fileContainer.html(newFileThumbnail);
                });

                selectedFiles.forEach(function (fileObject) {
                    var fileThumbnail = _.template(FileThumbnailTemplate)(fileObject);

                    that.$el.find('.attachments-' + fileObject.branchId).prepend(fileThumbnail);
                });

                this.applyToAll = false;
            }
        },

        handleSelectFileClick: function (event) {
            var target = $(event.currentTarget);

            this.workingBranch = target.attr('data-branch-id');
            this.ui.fileInput.click();
        },

        handleFileSelected: function (event) {
            var that = this;
            var file = event.target.files[0];
            var fileReader = new FileReader();

            if (!this.allowedFileTypes.includes(file.type)) {
                return App.renderErrors([
                    ERROR_MESSAGES.forbiddenTypeOfFile[App.currentUser.currentLanguage]
                ]);
            }

            fileReader.readAsDataURL(file);
            fileReader.onload = function(fileReaderEvent) {
                var fileAsBase64String = fileReaderEvent.target.result;
                var fileType = fileAsBase64String.substr(0, 10);
                var fileObject = {
                    _id: shortId.gen(),
                    base64: fileAsBase64String,
                    fileType: fileType,
                    fileName: file.name,
                    file: file,
                    branchId: that.workingBranch,
                };

                that.selectedFiles.push(fileObject);

                var fileThumbnail = _.template(FileThumbnailTemplate)(fileObject);

                that.$el.find('.attachments-' + that.workingBranch).prepend(fileThumbnail);
            };
        },

        handleDeleteFileClick: function (event) {
            var target = $(event.target);
            var fileId = target.attr('data-file-id');
            var selectedFiles = this.selectedFiles;

            var fileIndex = selectedFiles.findIndex(function (item) {
                return item._id === fileId;
            });

            selectedFiles.splice(fileIndex, 1);
            this.$el.find('#file-thumbnail-' + fileId).remove();
        },

        save: function () {

        },

        render: function () {
            var that = this;
            var layout = this.template(this.templateOptions);

            that.$el = $(layout).dialog({
                width : 'auto',
                dialogClass : 'edit-dialog visibilityFormHeight',
                buttons : {
                    save : {
                        text : that.translation.saveBtn,
                        click : that.save.bind(that),
                    },
                }
            });

            this.delegateEvents(this.events);
        }

    });

});
