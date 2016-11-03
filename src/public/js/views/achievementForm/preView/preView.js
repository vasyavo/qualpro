define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/achievementForm/preview.html',
    'text!templates/file/preView.html',
    'collections/file/collection',
    'views/baseDialog',
    'views/fileDialog/fileDialog',
    'models/achievementForm'
], function (Backbone, _, $, PreviewTemplate, FilePreviewTemplate,
             FileCollection, BaseView, FileDialogPreviewView, Model) {

    var PreviewView = BaseView.extend({
        contentType: 'achievementForm',

        template           : _.template(PreviewTemplate),
        filePreviewTemplate: _.template(FilePreviewTemplate),

        events: {
            'click .fileThumbnailItem': 'showFilePreviewDialog',
            'click #downloadFile'     : 'stopPropagation'
        },

        initialize: function (options) {
            var self = this;

            this.translation = options.translation;
            this.model = options.model.toJSON() ? options.model : new Model(options.model, {merge: true, parse: true});
            this.previewFiles = new FileCollection(this.model.get('attachments'));

            self.makeRender();
            self.render();
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

        setSelectedFiles: function () {
            var self = this;
            var files = this.previewFiles.toJSON();
            var $fileContainer = self.$el.find('#objectiveFileThumbnail');

            if (files.length) {
                self.$el.find('.filesBlock').show();
            }

            $fileContainer.html('');

            files.forEach(function (file) {
                $fileContainer.append(self.filePreviewTemplate({
                    model: file
                }));
            });
        },

        render: function () {
            var jsonModel = this.model.toJSON();
            var formString;
            var self = this;

            formString = this.$el.html(this.template({model: jsonModel, translation: this.translation}));

            this.$el = formString.dialog({
                dialogClass  : 'create-dialog competitorBranding-dialog',
                title        : this.translation.title,
                width        : '1000',
                showCancelBtn: false,
                buttons      : {
                    save: {
                        text : this.translation.saveBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            self.undelegateEvents();
                            self.$el.dialog('close').dialog('destroy').remove();
                        }
                    }
                },
                close        : function () {
                    var model = self.model;
                    var id;
                    var previousAttributes;

                    if (model.changedAttributes()) {
                        id = model.get('_id');
                        previousAttributes = model.previousAttributes();
                        model.clear();
                        model.set(previousAttributes);
                        model.set({_id: id});
                    }

                    $('body').css({overflow: 'inherit'});
                }
            });

            this.$el.find('.filesBlock').hide();
            this.setSelectedFiles();

            this.delegateEvents(this.events);

            return this;
        }
    });

    return PreviewView;
});