define(function (require) {

    var _ = require('underscore');
    var shortId = require('shortId');
    var async = require('async');
    var Backbone = require('backbone');
    var dataService = require('dataService');
    var CONSTANTS = require('constants/otherConstants');
    var ERROR_MESSAGES = require('constants/errorMessages');
    var FileThumbnailTemplate = require('text!templates/objectives/visibilityForm/file-thumbnail.html');
    var NewFileThumbnailTemplate = require('text!templates/objectives/visibilityForm/new-file-thumbnail.html');
    var Template = require('text!templates/objectives/visibilityForm/preview.html');

    require('lightSlider');

    return Backbone.View.extend({

        initialize: function (options) {
            this.translation = options.translation;
            this.model = options.visibilityFormData;
            this.branches = options.branches;
            this.location = options.location;
            this.withoutBranches = options.withoutBranches;
            this.beforeDescription = options.beforeDescription;
            this.permittedToEditAfterPart = options.permittedToEditAfterPart;
            this.formId = this.model._id;

            this.allowedFileTypes = CONSTANTS.IMAGE_CONTENT_TYPES.concat(CONSTANTS.VIDEO_CONTENT_TYPES);

            this.render();
            this.defineUIElements();
        },

        defineUIElements: function () {
            var view = this.$el;

            this.ui = {
                fileInput: view.find('#file-input'),
            };
        },

        selectedFiles: [],

        template: _.template(Template),

        events: {
            'click .select-file': 'handleSelectFileClick',
            'change #file-input': 'handleFileSelected',
            'click .remove-attachment': 'handleDeleteFileClick'
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

        render: function () {
            var that = this;
            var branches = [];

            if (this.withoutBranches) {
                var beforeFileContainers = this.model.before.files.map(function (fileObj) {
                    var fileType = fileObj.contentType.substr(0, 5);

                    if (fileType === 'video') {
                        return {
                            container: '<video class="showPreview no-branches before" width="400" controls><source src="' + fileObj.url + '"></video>',
                            fileName: fileObj.originalName
                        };
                    } else {
                        return {
                            container: '<img class="imgResponsive showPreview no-branches before" src="' + fileObj.url + '">',
                            fileName: fileObj.originalName
                        };
                    }
                });

                var afterFileContainers = this.model.after.files.map(function (fileObj) {
                    var fileType = fileObj.contentType.substr(0, 5);

                    if (fileType === 'video') {
                        return {
                            container: '<video class="showPreview no-branches before" width="400" controls><source src="' + fileObj.url + '"></video>',
                            fileName: fileObj.originalName
                        };
                    } else {
                        return {
                            container: '<img class="imgResponsive showPreview no-branches before" src="' + fileObj.url + '">',
                            fileName: fileObj.originalName
                        };
                    }
                });

                branches = [{
                    _id: 'withoutbranch',
                    name: this.location,
                    beforeFileContainers: beforeFileContainers,
                    afterFileContainers: afterFileContainers,
                    beforeDescription: that.beforeDescription,
                    afterDescription: that.model.after.description
                }];
            } else {
                branches = this.branches.map(function (branch) {
                    var branchFromVFData = that.model.branches.find(function (item) {
                        return item.branchId === branch._id;
                    });

                    branch.afterDescription = branchFromVFData.after.description;
                    branch.beforeDescription = that.beforeDescription;

                    branch.beforeFileContainers = branchFromVFData ? branchFromVFData.before.files.map(function (fileObj) {
                        var fileType = fileObj.contentType.substr(0, 5);

                        if (fileType === 'video') {
                            return {
                                container: '<video class="showPreview no-branches before" width="400" controls><source src="' + fileObj.url + '"></video>',
                                fileName: fileObj.originalName
                            };
                        } else {
                            return {
                                container: '<img class="imgResponsive showPreview no-branches before" src="' + fileObj.url + '">',
                                fileName: fileObj.originalName
                            };
                        }
                    }) : [];

                    branch.afterFileContainers = branchFromVFData ? branchFromVFData.after.files.map(function (fileObj) {
                        var fileType = fileObj.contentType.substr(0, 5);

                        if (fileType === 'video') {
                            return {
                                container: '<video class="showPreview no-branches before" width="400" controls><source src="' + fileObj.url + '"></video>',
                                fileName: fileObj.originalName
                            };
                        } else {
                            return {
                                container: '<img class="imgResponsive showPreview no-branches before" src="' + fileObj.url + '">',
                                fileName: fileObj.originalName
                            };
                        }
                    }) : [];

                    return branch;
                });
            }

            var layout = this.template({
                translation : this.translation,
                branches: branches,
                permittedToEditAfterPart: this.permittedToEditAfterPart
            });

            this.$el = $(layout).dialog({
                showCancelBtn: false,
                width        : 'auto',
                dialogClass  : 'create-dialog visibilityFormHeight',
                buttons      : {
                    save: {
                        text : that.translation.okBtn,
                        click: function () {
                            async.waterfall([
                                function (cb) {
                                    var newSelectedFiles = that.selectedFiles.filter(function (item) {
                                        return !item.uploaded;
                                    });

                                    if (newSelectedFiles.length) {
                                        var formData = new FormData();

                                        newSelectedFiles.forEach(function (item, index) {
                                            formData.append(index, item.file);
                                        });

                                        $.ajax({
                                            url: '/file',
                                            method: 'POST',
                                            data: formData,
                                            contentType: false,
                                            processData: false,
                                            success: function (response) {
                                                cb(null, response);
                                            },
                                            error: function () {
                                                App.renderErrors([
                                                    ERROR_MESSAGES.filesNotUploaded[App.currentUser.currentLanguage]
                                                ]);
                                            }
                                        });
                                    } else {
                                        cb(null, {
                                            files: []
                                        })
                                    }
                                },

                                function (uploadedFilesObject, cb) {
                                    var visibilityFormRequestData = null;

                                    if (uploadedFilesObject.files.length || that.selectedFiles.length) {
                                        if (that.withoutBranches) {
                                            var afterDescription = that.$el.find('#after-description-text-area-withoutbranch').val().trim();
                                            var arrayOfFileId = [];

                                            that.selectedFiles.forEach(function (item) {
                                                if (item.uploaded) {
                                                    arrayOfFileId.push(item._id);
                                                }
                                            });

                                            uploadedFilesObject.files.forEach(function (item) {
                                                arrayOfFileId.push(item._id);
                                            });

                                            visibilityFormRequestData = {
                                                after: {
                                                    files: arrayOfFileId,
                                                    description: afterDescription
                                                },
                                            };
                                        } else {
                                            visibilityFormRequestData = {
                                                branches: that.selectedFiles.map(function (item) {
                                                    var afterDescription = that.$el.find('#after-description-text-area-' + item.branchId).val().trim();
                                                    var arrayOfFilesDependsOnBranch = that.selectedFiles.filter(function (fileObj) {
                                                        return fileObj.branchId === item.branchId;
                                                    });

                                                    var arrayOfFileIds = arrayOfFilesDependsOnBranch.map(function (fileObj) {
                                                        if (fileObj.uploaded) {
                                                            return fileObj._id;
                                                        }

                                                        var searchedUploadedFile = uploadedFilesObject.files.find(function (obj) {
                                                            return obj.originalName === fileObj.fileName;
                                                        });

                                                        return searchedUploadedFile._id;
                                                    });

                                                    return {
                                                        branchId: item.branchId,
                                                        after: {
                                                            files: arrayOfFileIds,
                                                            description: afterDescription
                                                        }
                                                    };
                                                })
                                            };
                                        }
                                    }

                                    if (visibilityFormRequestData) {
                                        $.ajax({
                                            url: 'form/visibility/after/' + that.formId,
                                            method: 'PATCH',
                                            contentType: 'application/json',
                                            dataType: 'json',
                                            data: JSON.stringify(visibilityFormRequestData),
                                            success: function () {
                                                cb(null);
                                            },
                                            error: function () {
                                                cb(null);
                                            }
                                        });
                                    } else {
                                        cb(null);
                                    }
                                }
                            ], function (err) {
                                if (err) {
                                    return App.renderErrors([
                                        ERROR_MESSAGES.somethingWentWrong[App.currentUser.currentLanguage]
                                    ]);
                                }

                                that.$el.dialog('close').dialog('destroy').remove();
                            });
                        }
                    }
                }
            });

            if (this.permittedToEditAfterPart) {
                if (this.withoutBranches) {
                    that.selectedFiles = this.model.after.files.map(function (item) {
                        return {
                            fileType: item.contentType,
                            fileName: item.originalName,
                            base64: item.url,
                            _id: item._id,
                            branchId: 'withoutbranch',
                            uploaded: true
                        };
                    });

                    that.selectedFiles.forEach(function (item) {
                        var fileThumbnail = _.template(FileThumbnailTemplate)(item);
                        that.$el.find('.attachments-withoutbranch').append(fileThumbnail);
                    });

                    var newFileThumbnail = _.template(NewFileThumbnailTemplate)({
                        branchId: 'withoutbranch'
                    });
                    that.$el.find('.attachments-withoutbranch').append(newFileThumbnail);
                }
            }

            this.$el.find('.files-container').lightSlider({
                item: 1,
                loop: true,
                slideMargin: 10,
                pager: false,
                enableDrag: false,
                adaptiveHeight: true
            });

            this.delegateEvents(this.events);
        }

    });

});
