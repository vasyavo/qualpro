define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/brandingActivity/preview.html',
    'text!templates/file/preView.html',
    'collections/file/collection',
    'models/file',
    'models/brandingActivity',
    'views/baseDialog',
    'populate',
    'constants/otherConstants',
    'constants/levelConfig',
    'helpers/implementShowHideArabicInputIn',
    'dataService',
    'constants/contentType',
    'views/objectives/fileDialogView',
    'views/brandingActivity/brandingActivityItemsView',
    'views/fileDialog/fileDialog'
], function (Backbone, _, $, PreviewTemplate, FileTemplate,
             FileCollection, FileModel, BrandingAndDisplayModel, BaseView, populate, CONSTANTS,
             LEVEL_CONFIG, implementShowHideArabicInputIn, dataService, CONTENT_TYPES, FileDialogView,
             brandingAndDisplayItemsView, FileDialogPreviewView) {

    var PreviewView = BaseView.extend({
        contentType : CONTENT_TYPES.BRANDING_ACTIVITY,
        template    : _.template(PreviewTemplate),
        fileTemplate: _.template(FileTemplate),
        CONSTANTS   : CONSTANTS,

        events: {
            'click #edit'                                : 'editBrandingAndDisplay',
            'click #duplicate'                           : 'duplicateBrandingAndDisplay',
            'click #brandingAndDisplayItems'             : 'brandingAndDisplayItems',
            'click .fileThumbnailItem, .masonryThumbnail': 'showFilePreviewDialog',
            'click #goToBtn'                             : 'goTo',
            'click #downloadFile'                        : 'stopPropagation'
        },

        initialize: function (options) {

            this.activityList = options.activityList;
            this.translation = options.translation;
            this.model = options.model;
            this.files = new FileCollection();
            this.previewFiles = new FileCollection(this.model.get('attachments'), true);

            this.makeRender();
            this.render();
        },

        editBrandingAndDisplay: function () {
            this.off('change');
            this.$el.dialog('destroy');
            this.trigger('showEditBrandingAndDisplayDialog', this.model);
        },

        duplicateBrandingAndDisplay: function () {
            var jsonModel = this.model.toJSON();
            var model;

            delete jsonModel._id;
            delete jsonModel.attachments;

            jsonModel.status = CONSTANTS.PROMOTION_STATUSES.DRAFT;

            model = new BrandingAndDisplayModel(jsonModel);

            this.trigger('showEditBrandingAndDisplayDialog', model, true);
            this.$el.dialog('close').dialog('destroy').remove();
        },

        brandingAndDisplayItems: function () {
            var id = this.model.id;

            this.brandingAndDisplayItemsView = new brandingAndDisplayItemsView({
                brandingAndDisplay: id,
                translation       : this.translation
            });
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

        chengeCountOfAttachedFilesToComment: function (count) {
            this.$el.find('#newCommentAttachments').text(count);
        },

        setSelectedFiles: function (files) {
            var self = this;
            var $fileContainer = self.$el.find('#objectiveFileThumbnail');

            if (files.length) {
                self.$el.find('.filesBlock').show();
            }

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
            var level = App.currentUser.accessRole.level;
            var currentConfig = (!this.activityList) ? LEVEL_CONFIG[this.contentType][level].preview : LEVEL_CONFIG[this.contentType].activityList.preview;
            if (this.model.get('status') === 'expired') {
                currentConfig = LEVEL_CONFIG[this.contentType][level].preview;
            }

            formString = this.$el.html(this.template({
                jsonModel   : jsonModel,
                translation : this.translation,
                activityList: this.activityList
            }));

            this.$el = formString.dialog({
                dialogClass  : 'create-dialog competitorBranding-dialog',
                title        : this.translation.preViewTitle,
                width        : '1000',
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

            if ([1, 2, 3, 4, 8, 9, 10].indexOf(level) !== -1 && App.currentUser.workAccess) {
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
            }

            this.setSelectedFiles(jsonModel.attachments);

            this.delegateEvents(this.events);

            return this;
        }
    });

    return PreviewView;
});
