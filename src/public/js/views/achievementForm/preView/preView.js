define([
    'backbone',
    'Underscore',
    'jQuery',
    'moment',
    'text!templates/achievementForm/preview.html',
    'text!templates/file/preView.html',
    'collections/file/collection',
    'views/baseDialog',
    'views/fileDialog/fileDialog',
    'models/achievementForm',
    'constants/levelConfig',
    'views/achievementForm/edit',
    'models/achievementForm',
    'constants/infoMessages'
], function (Backbone, _, $, moment, PreviewTemplate, FilePreviewTemplate,
             FileCollection, BaseView, FileDialogPreviewView, Model, LEVEL_CONFIG, EditView, AchievementFormModel, INFO_MESSAGES) {

    var PreviewView = BaseView.extend({
        contentType: 'achievementForm',

        template           : _.template(PreviewTemplate),
        filePreviewTemplate: _.template(FilePreviewTemplate),

        events: {
            'click .fileThumbnailItem': 'showFilePreviewDialog',
            'click #downloadFile'     : 'stopPropagation',
            'click #goToBtn'          : 'goTo',
            'click #edit' : 'showEditView',
            'click #delete' : 'deleteAchievementForm',
        },

        initialize: function (options) {
            var self = this;

            this.activityList = options.activityList;
            this.translation = options.translation;
            this.model = options.model.toJSON() ? options.model : new Model(options.model, {merge: true, parse: true});
            this.previewFiles = new FileCollection(this.model.get('attachments'));

            self.makeRender();
            self.render();
        },

        showEditView: function () {
            var that = this;

            this.editView = new EditView({
                translation: this.translation,
                editableModel: this.model.toJSON(),
            });

            this.editView.on('edit-achievement-form-item', function (data, achievementFormId) {
                var model = new AchievementFormModel();

                model.edit(achievementFormId, data);

                model.on('achievement-form-edited', function (response) {
                    var view = that.$el;
                    var startDate = data.startDate;
                    var endDate = data.endDate;

                    response.startDate = moment.utc(response.startDate).format('DD.MM.YYYY');
                    response.endDate = moment.utc(response.endDate).format('DD.MM.YYYY');
                    that.model.set(response, {merge: true});

                    if (startDate) {
                        view.find('#date-start').html(moment.utc(startDate).format('DD.MM.YYYY'));
                    }

                    if (endDate) {
                        view.find('#date-end').html(moment.utc(endDate).format('DD.MM.YYYY'));
                    }

                    view.find('#description').html(data.description[App.currentUser.currentLanguage]);
                    view.find('#additionalComment').html(data.additionalComment[App.currentUser.currentLanguage]);

                    that.editView.$el.dialog('close').dialog('destroy').remove();

                    that.trigger('update-list-view');
                });
            });
        },

        deleteAchievementForm: function () {
            if (confirm(INFO_MESSAGES.confirmDeleteAchievementFormReport[App.currentUser.currentLanguage])) {
                var that = this;
                var model = new AchievementFormModel();

                model.delete(this.model.get('_id'));

                model.on('achievement-form-deleted', function () {
                    that.trigger('update-list-view');

                    that.$el.dialog('close').dialog('destroy').remove();
                });
            }
        },

        showFilePreviewDialog: _.debounce(function (e) {
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
        }, 1000, true),

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
            var currentConfig;

            if (this.activityList) {
                currentConfig = LEVEL_CONFIG[this.contentType].activityList.preview;
            } else {
                currentConfig = LEVEL_CONFIG[this.contentType][App.currentUser.accessRole.level] ? LEVEL_CONFIG[this.contentType][App.currentUser.accessRole.level].preview : [];
            }

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

            if (App.currentUser.workAccess && currentConfig && currentConfig.length) {
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
            this.setSelectedFiles();

            this.delegateEvents(this.events);

            return this;
        }
    });

    return PreviewView;
});
