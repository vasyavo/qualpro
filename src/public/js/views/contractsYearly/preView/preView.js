define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/contractsYearly/preView/preView.html',
    'text!templates/file/preView.html',
    'collections/file/collection',
    'models/file',
    'models/contractsYearly',
    'models/documents',
    'views/baseDialog',
    'populate',
    'constants/otherConstants',
    'constants/levelConfig',
    'helpers/implementShowHideArabicInputIn',
    'dataService',
    'constants/contentType',
    'views/documents/preView/preView'
], function (Backbone, _, $, PreviewTemplate, FileTemplate,
             FileCollection, FileModel, Model, DocumentsModel, BaseView, populate, CONSTANTS,
             LEVEL_CONFIG, implementShowHideArabicInputIn, dataService, CONTENT_TYPES, PreView) {
    'use strict';

    var PreviewView = BaseView.extend({
        contentType : CONTENT_TYPES.CONTRACTSYEARLY,
        template    : _.template(PreviewTemplate),
        fileTemplate: _.template(FileTemplate),
        CONSTANTS   : CONSTANTS,

        events: {
            'click #edit'             : 'editContractsYearly',
            'click #duplicate'        : 'duplicateContractsYearly',
            'click .fileThumbnailItem': 'showFilePreviewDialog',
            'click #goToBtn'          : 'goTo'
        },

        initialize: function (options) {

            this.activityList = options.activityList;
            this.translation = options.translation;
            this.model = options.model;
            this.model.get('documents').forEach(function (document) {
                document['selected'] = true;
                document['name'] = document['title']
            });
            this.model.set({attachments: this.model.get('documents')});
            this.files = new FileCollection();
            this.previewFiles = new FileCollection(this.model.get('attachments'), true);
            this.makeRender();
            this.render();
        },

        editContractsYearly: function () {
            this.off('change');
            this.$el.dialog('destroy');
            this.trigger('showEditDialog', this.model);
        },

        duplicateContractsYearly: function () {
            var jsonModel = this.model.toJSON();
            var model;

            jsonModel.status = CONSTANTS.PROMOTION_STATUSES.DRAFT;
            jsonModel = _.pick(jsonModel, 'type', 'country', 'description', 'status');

            model = new Model(jsonModel);

            this.trigger('showEditDialog', model, true);
            this.$el.dialog('close').dialog('destroy').remove();
        },

        showFilePreviewDialog: function (e) {
            var $el = $(e.target);
            var fileModelId = $el.attr('data-id') || $el.closest('.masonryThumbnail').attr('data-id');
            var fileModel = this.previewFiles.get(fileModelId);
            var self = this;
            $.ajax({
                url        : CONTENT_TYPES.DOCUMENTS + '/' + fileModel.id,
                type       : 'GET',
                contentType: false,
                processData: false,
                success    : function (model) {
                    var model = new DocumentsModel(model, {parse: true});
                    self.PreView = new PreView({
                        model      : model,
                        translation: self.translation
                    });
                }
            });
        },

        setSelectedFiles: function (files) {
            var self = this;
            var $fileContainer = self.$el.find('#objectiveFileThumbnail');

            if (files) {
                if (files.length) {
                    self.$el.find('.filesBlock').show();
                }

                $fileContainer.html('');

                files.forEach(function (file) {
                    $fileContainer.append(self.fileTemplate({
                        model: file
                    }));
                });
            }
        },

        render: function () {
            var jsonModel = this.model.toJSON();
            var formString;
            var self = this;
            var level = App.currentUser.accessRole.level;
            var currentConfig = (!this.activityList) ? LEVEL_CONFIG[this.contentType]['1'].preview : LEVEL_CONFIG[this.contentType].activityList.preview;

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

            if (((level <= 2) || (level >= 8)) && jsonModel.status._id !== 'expired') {
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