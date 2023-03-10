var $ = require('jquery');
var _ = require('underscore');
var FileTemplate = require('../../../templates/file/preView.html');
var CreateTemplate = require('../../../templates/notes/create.html');
var BaseView = require('../../views/baseDialog');
var FileDialogView = require('../../views/objectives/fileDialogView');
var Model = require('../../models/notes');
var FileCollection = require('../../collections/file/collection');
var FileModel = require('../../models/file');
var CONTENT_TYPES = require('../../constants/contentType');
var CONSTANTS = require('../../constants/otherConstants');
var App = require('../../appState');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.NOTES,

    template: _.template(CreateTemplate),
    fileTemplate: _.template(FileTemplate),

    ALLOWED_CONTENT_TYPES: _.union(
        CONSTANTS.IMAGE_CONTENT_TYPES,
        CONSTANTS.VIDEO_CONTENT_TYPES,
        CONSTANTS.MS_WORD_CONTENT_TYPES,
        CONSTANTS.MS_EXCEL_CONTENT_TYPES,
        CONSTANTS.MS_POWERPOINT_CONTENT_TYPES,
        CONSTANTS.OTHER_FORMATS
    ),

    initialize: function (options) {
        this.locationFilter = {};
        this.files = new FileCollection();
        this.model = new Model();
        this.translation = options.translation;

        this.makeRender();
        this.render();

        _.bindAll(this, 'fileSelected');
    },

    events : {
        'click #attach-file' : 'showAttachDialog'
    },

    showAttachDialog: function () {
        this.fileDialogView = new FileDialogView({
            files      : this.files,
            contentType: this.contentType,
            translation: this.translation,
            dialogTitle: this.translation.attachmentsDialogTitle,
            buttonName : this.translation.attach
        });
        this.fileDialogView.on('clickAttachFileButton', this.attachFile, this);
        this.fileDialogView.on('removeFile', this.removeFile, this);
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
            var model;
            var type;
            if (!result) {
                self.files.remove(fileModel);
                return;
            }
            type = $fileInput.prop('files')[0].type;

            if (self.ALLOWED_CONTENT_TYPES.indexOf(type) === -1) {
                App.render({type: 'error', message: ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage]});
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

    saveNote: function (cb) {
        var self = this;
        var $curEl = this.$el;

        this.body = {
            theme      : $curEl.find('#themeDb').val(),
            title      : $curEl.find('#titleDb').val(),
            description: $curEl.find('.noteTextarea[data-property="en"]').val()
        };

        this.model.setFieldsNames(this.translation);

        this.model.validate(this.body, function (err) {
            if (err && err.length) {
                App.renderErrors(err);
            } else {
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
    },

    render: function () {
        var jsonModel = this.model.toJSON();
        var formString = this.template({
            jsonModel  : jsonModel,
            translation: this.translation
        });
        var self = this;

        this.$el = $(formString).dialog({
            dialogClass: 'create-dialog full-height-dialog notesDialog',
            title      : this.translation.createTitle,
            width      : '1000',
            buttons    : {
                save  : {
                    text : this.translation.saveBtn,
                    class: 'btn saveBtn',
                    click: function () {
                        var that = this;

                        self.saveNote(function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                },
                cancel: {
                    text: this.translation.cancelBtn
                }
            }
        });

        this.$el.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);

        this.$el.find('.noteTextarea').each(function (index, element) {
            var $element = $(element);

            $element.ckeditor({language: $element.attr('data-property')});
        });

        this.delegateEvents(this.events);

        return this;
    }
});
