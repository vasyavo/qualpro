define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/documents/create.html',
    'text!templates/file/preView.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'models/documents',
    'populate',
    'collections/file/collection',
    'models/file',
    'constants/otherConstants',
    'constants/contentType',
    'constants/errorMessages'
], function (Backbone, _, $, CreateTemplate, FileTemplate, BaseView, FileDialogView,
             Model, populate, FileCollection, FileModel, CONSTANTS, CONTENT_TYPES, ERROR_MESSAGES) {
    'use strict';

    var CreateView = BaseView.extend({
        contentType : CONTENT_TYPES.DOCUMENTS,
        template    : _.template(CreateTemplate),
        fileTemplate: _.template(FileTemplate),
        body        : {},
        ALLOWED_CONTENT_TYPES: _.union(CONSTANTS.IMAGE_CONTENT_TYPES, CONSTANTS.MS_WORD_CONTENT_TYPES, CONSTANTS.MS_EXCEL_CONTENT_TYPES, CONSTANTS.OTHER_FORMATS, CONSTANTS.VIDEO_CONTENT_TYPES),

        events: {
            'click #attachFile': 'showAttachDialog'
        },

        initialize: function (options) {
            this.contract = options.contract;
            this.files = new FileCollection();
            this.locationFilter = {};
            this.model = new Model();
            this.translation = options.translation;
            this.makeRender();
            this.render();

            _.bindAll(this, 'fileSelected');
        },

        saveDocument: function (cb) {
            var self = this;
            var $curEl = this.$el;
            this.checkForEmptyInput(this.files, this.$el);
            this.body.title = $curEl.find('#titleDd').val();
            this.body.attachments = this.files.length ? this.files : null;


            this.model.setFieldsNames(this.translation);

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    if (self.body.attachments) {
                        delete self.body.attachments;
                    }

                    self.$el.find('#mainForm').submit();
                    cb();
                }
            });
        },

        formSubmit: function (e) {
            var context = e.data.context;
            var data = new FormData(this);

            e.preventDefault();
            data.append('data', JSON.stringify(context.body));

            if (!context.contract) {
                $.ajax({
                    url        : context.model.urlRoot(),
                    type       : 'POST',
                    data       : data,
                    contentType: false,
                    processData: false,
                    success    : function (xhr) {
                        var model = new Model(xhr, {parse: true});

                        context.trigger('modelSaved', model);
                    }
                });
            } else {
                if (context.files.length) {
                    context.trigger('contract', {title: context.body.title, inputModel: context.files.models[0]});
                }
            }
        },

        showAttachDialog: function () {
            this.fileDialogView = new FileDialogView({
                selectOne  : true,
                files      : this.files,
                contentType: this.contentType,
                dialogTitle: this.translation.documentFile,
                translation: this.translation,
                buttonName : this.translation.attach
            });
            this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
            this.fileDialogView.on('removeFile', this.removeFile, this);
        },

        removeFile: function (file) {
            var $thumbnail = this.$el.find('.fileThumbnailItem[data-id = "' + file.cid + '"]');

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

                // if (type !== 'application/pdf' ) {
                //     App.render({type: 'error', message: ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage]});
                //     return;
                // }

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

                self.$el.find('#filesBlock').show();
                self.fileDialogView.trigger('fileSelected', fileModel);
                App.masonryGrid.call(self.$el);
            };

        },

        attachFile: function () {
            var fileInput;
            var fileModel = new FileModel();

            this.files.add(fileModel);
            this.$el.find('#mainForm').append('<input accept="' + this.ALLOWED_CONTENT_TYPES.join(', ') + '" type="file" name="' + fileModel.cid + '" id="' + fileModel.cid + '" style="display: none">');
            fileInput = this.$el.find('#' + fileModel.cid);
            fileInput.on('change', {fileInput: fileInput}, this.fileSelected);
            fileInput.click();
        },

        render: function () {
            var self = this;
            var jsonModel = this.model.toJSON();
            var formString = this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            });
            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog',
                title      : this.translation.createTitle,
                width      : '800',
                height     : '500',
                buttons    : {
                    save  : {
                        text : this.translation.saveBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            var that = this;

                            self.saveDocument(function () {
                                $(that).dialog('destroy').remove();
                            });
                        }
                    },
                    cancel: {
                        text: this.translation.cancelBtn
                    }
                }
            });

            this.$el.find('#filesBlock').hide();

            this.$el.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);

            this.$el.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;
});
