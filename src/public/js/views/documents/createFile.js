define(function (require) {

    var _ = require('underscore');
    var Backbone = require('backbone');
    var ERROR_MESSAGES = require('constants/errorMessages');
    var CONSTANTS = require('constants/otherConstants');
    var FileModel = require('models/file');
    var DocumentModel = require('models/documents');
    var Template = require('text!templates/documents/create-file.html');

    return Backbone.View.extend({

        initialize : function (options) {
            this.translation = options.translation;

            this.render();
            this.bindModelEvents();
            this.defineUIElements();
        },

        defineUIElements : function () {
            var context = this.$el;

            this.ui = {
                fileInput : context.find('#file-input'),
                fileHolder : context.find('#file-holder'),
                thumbnailItem : context.find('.fileThumbnailItem')
            };
        },

        ALLOWED_CONTENT_TYPES: _.union(CONSTANTS.IMAGE_CONTENT_TYPES, CONSTANTS.MS_WORD_CONTENT_TYPES, CONSTANTS.MS_EXCEL_CONTENT_TYPES, CONSTANTS.OTHER_FORMATS, CONSTANTS.VIDEO_CONTENT_TYPES),

        model : new DocumentModel(),

        template : _.template(Template),

        events : {
            'click #attach-file' : 'showAttachFileView',
            'change #file-input' : 'saveFileInMemory'
        },

        file : null,

        showAttachFileView : function () {
            this.ui.fileInput.click();
        },

        saveFileInMemory : function (event) {
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

            this.file = file;

            this.ui.thumbnailItem.removeClass('hidden');

            var fileReader = new FileReader();
            fileReader.readAsDataURL(file);
            fileReader.onload = function (event) {
                var preview;
                var fileHolder = that.ui.fileHolder;

                if (/image/.test(file.type)) {
                    var fileAsBase64String = event.target.result;

                    preview = document.createElement('img');
                    preview.src = fileAsBase64String;
                } else {
                    var fileModel = new FileModel();
                    var fileType = fileModel.getTypeFromContentType(file.type);

                    preview = document.createElement('div');
                    preview.className = 'iconThumbnail ' + fileType;
                }

                var div = document.createElement('div');
                div.className = 'objectivesFileName fontMicro';
                div.innerHTML = file.name;

                fileHolder.html('');

                fileHolder.append(preview);
                fileHolder.append(div);
            };
        },

        render : function () {
            var that = this;
            var layout = this.$el.html(this.template({
                translation : this.translation,
                allowedFileTypes : this.ALLOWED_CONTENT_TYPES.join(', ')
            }));

            this.$el = layout.dialog({
                dialogClass : 'create-dialog',
                title        : that.translation.preViewTitle,
                width      : '800',
                height     : '500',
                showCancelBtn: false,
                buttons      : {
                    save  : {
                        text : that.translation.saveBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            var formData = new FormData();
                            formData.append('file', that.file);

                            var data = {
                                title : that.$el.find('#title').val(),
                                type : 'file'
                            };
                            var folder = that.collection.folder;
                            if (folder) {
                                data.parent = folder;
                            }

                            that.model.saveFile(formData, data);
                        }
                    },
                    cancel: {
                        text: that.translation.cancelBtn,
                        class: 'btn cancelBtn',
                        click : function () {
                            that.remove();
                        }
                    }
                }
            });
        },

        bindModelEvents : function () {
            var that = this;
            var model = this.model;

            model.on('saved', function (savedData) {
                that.trigger('file:saved', savedData);
                that.remove();
            });
        }

    });

});
