define(function (require) {

    var $ = require('jQuery');
    var _ = require('Underscore');
    var Backbone = require('backbone');
    var async = require('async');
    var VisibilityFormModel = require('models/visibilityForm');
    var ERROR_MESSAGES = require('constants/errorMessages');
    var CONSTANTS = require('constants/otherConstants');
    var Template = require('text!templates/objectives/visibilityForm/previewWithoutBranches.html');

    return Backbone.View.extend({

        initialize : function (options) {
            var that = this;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

            this.formId = options.formId;
            this.assigneId = options.assigneId;
            this.translation = $(options.description[currentLanguage]).text();
            this.templateOptions = {
                translation : this.translation,
                beforeDescription : options.beforeDescription,
                location : options.location,
                editAfter : false,
                allowed : CONSTANTS.IMAGE_CONTENT_TYPES.concat(CONSTANTS.VIDEO_CONTENT_TYPES).join(', ')
            };

            this.model = new VisibilityFormModel({
                _id : that.formId
            });
            this.model.fetch({
                success: function () {
                    var afterPart = that.model.get('after');
                    if (afterPart.description) {
                        that.trigger('after-part-filled');
                    }

                    that.render();
                    that.defineUiElements();
                },
                error  : function () {
                    App.render({
                        type : 'error',
                        message : ERROR_MESSAGES.readError[App.currentUser.currentLanguage]
                    });
                    this.destroy();
                }
            });
        },

        defineUiElements : function () {
            var view = this.$el;
            this.ui = {
                filePreviewHolder : view.find('#imageMy'),
                removeFileButton : view.find('#remove'),
                newAfterDescription : view.find('#new-after-description')
            };
        },

        template : _.template(Template),

        selectedTempFile : null,

        events : {
            'change #photo' : 'saveTempFile',
            'click #remove' : 'removeFile'
        },

        saveTempFile : function (event) {
            var that = this;
            var file = event.target.files[0];
            var fileReader = new FileReader();

            fileReader.readAsDataURL(file);
            fileReader.onload = function(fileReaderEvent) {
                var container;
                var fileAsBase64String = fileReaderEvent.target.result;
                var fileType = fileAsBase64String.substr(0, 10);

                if (fileType === 'data:video') {
                    container = '<video width="400" controls><source src="' + fileAsBase64String + '"></video>';
                } else {
                    container = '<img id="myImg" class="imgResponsive" src="' + fileAsBase64String + '">';
                }

                that.ui.filePreviewHolder.html(container);
                that.ui.removeFileButton.removeClass('hidden');
            };

            that.selectedTempFile = file;
        },

        removeFile : function () {
            this.selectedTempFile = null;
            this.ui.filePreviewHolder.html('');
            this.ui.removeFileButton.addClass('hidden');
        },

        render : function () {
            var that = this;
            var beforeFileData = this.getBeforeFileData();
            var afterFileData = this.getAfterFileData();

            if (!afterFileData.afterDescription && this.assigneId === App.currentUser._id) {
                that.templateOptions.editAfter = true;
            } else if (!afterFileData.afterDescription && Object.keys(App.currentUser.covered).indexOf(this.assigneId) !== -1) {
                that.templateOptions.editAfter = true;
            }

            var layout = $(this.template(
                Object.assign({}, that.templateOptions, beforeFileData, afterFileData)
            ));

            this.$el = layout.dialog({
                width : 'auto',
                dialogClass : 'create-dialog visibilityFormHeight',
                buttons : {
                    save : {
                        text : that.translation.okBtn,
                        click : function () {
                            var newAfterDescription = that.ui.newAfterDescription.val();
                            if (newAfterDescription) {
                                async.waterfall([

                                    function (cb) {
                                        if (that.selectedTempFile) {
                                            var formData = new FormData();
                                            formData.append('file', that.selectedTempFile);

                                            $.ajax({
                                                url : '/file',
                                                method : 'POST',
                                                data : formData,
                                                contentType: false,
                                                processData: false,
                                                success : function (response) {
                                                    cb(null, response);
                                                },
                                                error : function () {
                                                    cb(true);
                                                }
                                            });
                                        } else {
                                            cb(null, {
                                                files : []
                                            });
                                        }
                                    },

                                    function (files, cb) {
                                        var requestPayload = {
                                            after : {
                                                files : files.files.map(function (item) {
                                                    return item._id;
                                                }),
                                                description : newAfterDescription
                                            }
                                        };

                                        $.ajax({
                                            url : 'form/visibility/after/' + that.formId,
                                            method : 'PATCH',
                                            contentType : 'application/json',
                                            dataType : 'json',
                                            data : JSON.stringify(requestPayload),
                                            success : function () {
                                                cb();
                                            },
                                            error : function () {
                                                cb(true);
                                            }
                                        });
                                    }

                                ], function (err) {
                                    if (err) {
                                        return App.render({
                                            type : 'error',
                                            message : ERROR_MESSAGES.notSaved[App.currentUser.currentLanguage]
                                        });
                                    }

                                    that.trigger('after-part-filled');

                                    that.$el.dialog('close').dialog('destroy').remove();
                                });
                            } else if (!newAfterDescription && that.selectedTempFile) {
                                App.render({
                                    type : 'error',
                                    message : ERROR_MESSAGES.enterDescription[App.currentUser.currentLanguage]
                                });
                            } else {
                                that.$el.dialog('close').dialog('destroy').remove();
                            }
                        }
                    }
                }
            });

            this.delegateEvents(this.events);
        },

        getBeforeFileData : function () {
            var data = {};
            var fileContainer;
            var file = this.model.get('before').files[0];

            if (file) {
            var fileType = file.contentType.substring(0, 5);

                if (fileType === 'video') {
                    fileContainer = '<video class="showPreview before" width="400" controls><source src="' + file.url + '"></video>';
                } else {
                    fileContainer = '<img class="imgResponsive showPreview before" src="' + file.url + '">';
                }

                data.beforeFileContainer = fileContainer;
                data.beforeFileName = file.originalName;
            } else {
                data.beforeFileContainer = '';
                data.beforeFileName = '';
            }

            return data;
        },

        getAfterFileData : function () {
            var data = {};
            var fileContainer;
            var file = this.model.get('after').files[0];
            if (file) {
                var fileType = file.contentType.substring(0, 5);

                if (fileType === 'video') {
                    fileContainer = '<video class="showPreview before" width="400" controls><source src="' + file.url + '"></video>';
                } else {
                    fileContainer = '<img class="imgResponsive showPreview before" src="' + file.url + '">';
                }

                data.afterFileContainer = fileContainer;
                data.afterFileName = file.originalName;
            } else {
                data.afterFileContainer = '';
                data.afterFileName = '';
            }

            data.afterDescription = this.model.get('after').description;

            return data;
        }

    });

});
