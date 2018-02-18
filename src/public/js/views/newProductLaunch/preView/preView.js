var $ = require('jquery');
var _ = require('underscore');
var moment = require('moment');
var PreviewTemplate = require('../../../../templates/newProductLaunch/preview.html');
var FilePreviewTemplate = require('../../../../templates/file/preView.html');
var FileCollection = require('../../../collections/file/collection');
var BaseView = require('../../../views/baseDialog');
var FileDialogPreviewView = require('../../../views/fileDialog/fileDialog');
var CONTENT_TYPES = require('../../../constants/contentType');
var LEVEL_CONFIG = require('../../../constants/levelConfig');
var EditView = require('../../../views/newProductLaunch/edit');
var NewProductLaunchModel = require('../../../models/newProductLaunch');
var INFO_MESSAGES = require('../../../constants/infoMessages');
var App = require('../../../appState');
var requireContent = require('../../../helpers/requireContent');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.NEWPRODUCTLAUNCH,

    template: _.template(PreviewTemplate),
    filePreviewTemplate: _.template(FilePreviewTemplate),

    events: {
        'click .masonryThumbnail': 'showFilePreviewDialog',
        'click #downloadFile': 'stopPropagation',
        'click #goToBtn': 'goTo',
        'click #edit': 'showEditView',
        'click #delete': 'deleteNewProductLaunch',
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

    showEditView: function () {
        var that = this;

        this.editView = new EditView({
            translation: this.translation,
            editableModel: this.model.toJSON(),
        });

        this.editView.on('edit-new-product-lunch', function (data, newProductLaunchId) {
            var currentLanguage = App.currentUser.currentLanguage;
            var model = new NewProductLaunchModel();

            model.edit(newProductLaunchId, data);

            model.on('new-product-launch-edited', function (response) {
                var view = that.$el;

                response.shelfLifeStart = moment.utc(response.shelfLifeStart).format('DD.MM.YYYY');
                response.shelfLifeEnd = moment.utc(response.shelfLifeEnd).format('DD.MM.YYYY');

                const name = response.brand.name;
                if (typeof name === 'string') {
                    response.brand = {
                        name: {
                            en: name,
                            ar: name,
                            custom: true,
                        },
                        _id: response.brand._id,
                    }
                }
                that.model.set(response, {merge: true});

                if (data.shelfLifeStart && data.shelfLifeEnd) {
                    view.find('#shelfLife').html(moment.utc(data.shelfLifeStart).format('DD.MM.YYYY') + '-' + moment.utc(data.shelfLifeEnd).format('DD.MM.YYYY'));
                }

                view.find('#packing').html(data.packing);
                view.find('#price').html(data.price);
                view.find('#additionalComment').html(data.additionalComment[currentLanguage]);
                view.find('#distributor').html(data.distributor[currentLanguage]);
                view.find('#origin').html(response.origin.name[currentLanguage]);
                view.find('#brand').html(response.brand.name[currentLanguage]);
                view.find('#category').html(response.category.name[currentLanguage]);

                var displayTypeString = response.displayType.map(function (item) {
                    return item.name[currentLanguage];
                }).join(', ');
                view.find('#displayType').html(displayTypeString);

                that.editView.$el.dialog('close').dialog('destroy').remove();

                that.trigger('update-list-view');
            });
        });
    },

    deleteNewProductLaunch: function () {
        if (confirm(INFO_MESSAGES.confirmDeleteNewProductLaunch[App.currentUser.currentLanguage])) {
            var that = this;
            var model = new NewProductLaunchModel();

            model.delete(this.model.get('_id'));

            model.on('new-product-launch-deleted', function () {
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
            fileModel: fileModel,
            bucket: this.contentType,
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

        if (!jsonModel.parsed) {
            jsonModel = this.model.parse(jsonModel);
        }

        var formString;
        var self = this;
        var currentConfig;
        var currentLanguage = App.currentUser.currentLanguage;
        var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

        if (this.activityList) {
            currentConfig = LEVEL_CONFIG[this.contentType].activityList.preview;
        } else {
            currentConfig = LEVEL_CONFIG[this.contentType][App.currentUser.accessRole.level] ? LEVEL_CONFIG[this.contentType][App.currentUser.accessRole.level].preview : [];
        }

        var newLabelClass = currentLanguage === 'en' ? 'newBrand' : 'newBrandAr';
        formString = this.$el.html(this.template({
            model: jsonModel,
            translation: this.translation,
            brandNewLabelClass: jsonModel.brand.name.currentLanguage ? '' : 'class="' + newLabelClass + '"',
            variantNewLabelClass: jsonModel.variant.name.currentLanguage ? '' : 'class="' + newLabelClass + '"',
            categoryNewLabelClass: (jsonModel.category && jsonModel.category.name && jsonModel.category.name.currentLanguage) ? '' : 'class="' + newLabelClass + '"',
            App: App,
            currentLanguage: currentLanguage,
            anotherLanguage: anotherLanguage,
        }));

        this.$el = formString.dialog({
            dialogClass: 'create-dialog competitorBranding-dialog',
            title: this.translation.all,
            width: '1000',
            showCancelBtn: false,
            buttons: {
                save: {
                    text: this.translation.saveBtn,
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

        if (App.currentUser.workAccess && currentConfig && currentConfig.length) {
            currentConfig.forEach(function (config) {
                var template = requireContent(config.template);
                var container = self.$el.find(config.selector);

                template = _.template(template);

                if (!container.find('#' + config.elementId).length) {
                    container[config.insertType](template({
                        elementId: config.elementId,
                        translation: self.translation
                    }));
                }
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
