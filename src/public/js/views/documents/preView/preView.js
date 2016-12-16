define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/documents/preView/preView.html',
    'text!templates/file/preView.html',
    'collections/file/collection',
    'models/file',
    'models/documents',
    'views/baseDialog',
    'populate',
    'constants/otherConstants',
    'constants/levelConfig',
    'helpers/implementShowHideArabicInputIn',
    'dataService',
    'constants/contentType',
    'views/fileDialog/fileDialog'

], function (Backbone, _, $, PreviewTemplate, FileTemplate,
             FileCollection, FileModel, Model, BaseView, populate, CONSTANTS,
             LEVEL_CONFIG, implementShowHideArabicInputIn, dataService, CONTENT_TYPES,
             FileDialogPreviewView) {
    'use strict';

    var PreviewView = BaseView.extend({
        contentType : CONTENT_TYPES.DOCUMENTS,
        template    : _.template(PreviewTemplate),
        fileTemplate: _.template(FileTemplate),
        CONSTANTS   : CONSTANTS,

        events: {
            'click .fileThumbnailItem': 'showFilePreviewDialog',
            'click #goToBtn'          : 'goTo',
            'click #downloadFile'     : 'stopPropagation'
        },

        initialize  : function (options) {

            this.activityList = options.activityList;
            this.translation = options.translation;
            this.model = options.model;
            this.files = new FileCollection();
            this.previewFiles = new FileCollection(this.model.get('attachments'));

            this.makeRender();
            this.render();
        },

        showFilePreviewDialog: function (e) {
            var $el = $(e.target);
            var $thumbnail = $el.closest('.masonryThumbnail');
            var fileModelId = $thumbnail.attr('data-id');
            var fileModel = this.previewFiles.get(fileModelId);

            this.fileDialogView = new FileDialogPreviewView({
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

        setSelectedFiles: function (files) {
            var self = this;
            var $fileContainer = this.$el.find('#objectiveFileThumbnail');

            this.$el.find('.filesBlock').show();


            $fileContainer.html('');

            files.forEach(function (file) {
                $fileContainer.append(self.fileTemplate({
                    model: file
                }));
            });

        },

        render: function () {
            var jsonModel = this.model.toJSON();
            var formString;
            var self = this;
            var currentConfig;

            formString = this.$el.html(this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            }));

            this.$el = formString.dialog({
                dialogClass  : 'create-dialog',
                title        : this.translation.preViewTitle,
                width        : 'auto',
                height       : 'auto',
                showCancelBtn: false,
                buttons      : {
                    save: {
                        text : this.translation.okBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            self.undelegateEvents();
                            self.$el.dialog('close').dialog('destroy').remove();
                        }
                    }
                }
            });

            if (this.activityList && App.currentUser.workAccess) {
                currentConfig = LEVEL_CONFIG[this.contentType].activityList.preview[0];

                require([
                        currentConfig.template
                    ],
                    function (template) {
                        var container = self.$el.find(currentConfig.selector);

                        template = _.template(template);

                        if (!container.find('#' + currentConfig.elementId).length) {
                            container[currentConfig.insertType](template({
                                elementId  : currentConfig.elementId,
                                translation: self.translation
                            }));
                        }
                    });
            }

            this.setSelectedFiles(jsonModel.attachments);

            this.delegateEvents(this.events);

            return this;
        }
    });

    return PreviewView;
});