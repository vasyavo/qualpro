define([
    'backbone',
    'Underscore',
    'jQuery',
    'text!templates/newProductLaunch/preview.html',
    'text!templates/file/preView.html',
    'collections/file/collection',
    'views/baseDialog',
    'views/fileDialog/fileDialog',
    'constants/contentType',
    'constants/levelConfig'
], function (Backbone, _, $, PreviewTemplate, FilePreviewTemplate,
             FileCollection, BaseView, FileDialogPreviewView, CONTENT_TYPES, LEVEL_CONFIG) {

    var PreviewView = BaseView.extend({
        contentType: CONTENT_TYPES.NEWPRODUCTLAUNCH,

        template           : _.template(PreviewTemplate),
        filePreviewTemplate: _.template(FilePreviewTemplate),

        events: {
            'click .masonryThumbnail': 'showFilePreviewDialog',
            'click #downloadFile'    : 'stopPropagation',
            'click #goToBtn'         : 'goTo',
        },

        initialize: function (options) {
            var self = this;

            this.activityList = options.activityList;
            this.translation = options.translation;
            this.model = options.model;
            this.files = new FileCollection();
            this.previewFiles = new FileCollection(this.model.get('attachments'), true);

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

        setSelectedFiles: function (files) {
            var self = this;
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
            var currentConfig = this.activityList ? LEVEL_CONFIG[this.contentType].activityList.preview : [];

            formString = this.$el.html(this.template({
                model      : jsonModel,
                translation: this.translation
            }));

            this.$el = formString.dialog({
                dialogClass  : 'create-dialog competitorBranding-dialog',
                title        : this.translation.all,
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

                close: function () {
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

            if (App.currentUser.workAccess && this.activityList) {
                currentConfig.forEach(function (config) {
                    require([
                            config.template
                        ],
                        function (template) {
                            var container = self.$el.find(config.selector);

                            template = _.template(template);

                            if (!container.find('#' + config.elementId).length) {
                                container[config.insertType](template({
                                    elementId  : config.elementId,
                                    translation: self.translation
                                }));
                            }
                        });

                });
            } else {
                this.$el.find('.objectivesTopBtnBlockSmall').hide();
            }

            this.$el.find('.filesBlock').hide();
            this.setSelectedFiles(jsonModel.attachments);

            this.delegateEvents(this.events);

            return this;
        }
    });

    return PreviewView;
});
