var $ = require('jquery');
var _ = require('underscore');
var lodash = require('lodash');
var shortId = require('shortid');
var Backbone = require('backbone');
var CONSTANTS = require('../../../constants/otherConstants');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var Template = require('../../../../templates/objectives/visibilityForm/edit.html');
var FileThumbnailTemplate = require('../../../../templates/objectives/visibilityForm/file-thumbnail.html');
var NewFileThumbnailTemplate = require('../../../../templates/objectives/visibilityForm/new-file-thumbnail.html');
var App = require('../../../appState');

module.exports = Backbone.View.extend({

    initialize: function (options) {
        var initialData = options.initialData;
        this.translation = options.translation;
        this.withoutBranches = options.withoutBranches;
        this.allowedFileTypes = CONSTANTS.IMAGE_CONTENT_TYPES.concat(CONSTANTS.VIDEO_CONTENT_TYPES);

        if (initialData) {
            this.applyToAll = initialData.applyToAll;
            this.selectedFiles = initialData.files;
        } else {
            this.selectedFiles = [];
        }

        this.templateOptions = {
            translation: this.translation,
            description: options.description,
            outlets: options.outlets,
            allowed : this.allowedFileTypes.join(', ')
        };

        if (this.withoutBranches) {
            this.templateOptions.outlets = [{
                name: '',
                branches: [{
                    _id: 'vfwithoutbranch',
                    name: options.locationString
                }]
            }];
        }

        this.render();
        this.defineUIElements();

        if (this.withoutBranches) {
            this.ui.applyToAllContainer.hide();
        }

        if (!this.applyToAll) {
            this.ui.applyToAllButton[0].checked = true;
        }

        this.ui.applyToAllButton.click();
    },

    defineUIElements: function () {
        var view = this.$el;

        this.ui = {
            fileInput: view.find('#file-input'),
            applyToAllButton: view.find('#apply-to-all'),
            applyToAllContainer: view.find('div.apply-to-all'),
        };
    },

    template: _.template(Template),

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
                _id: shortId.generate(),
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
        if (this.selectedFiles.length) {
            this.trigger('save', {
                files: this.selectedFiles.slice(),
                applyToAll: this.applyToAll
            });
        }

        this.$el.dialog('close').dialog('destroy').remove();
        this.remove();
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
