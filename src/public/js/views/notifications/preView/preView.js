var $ = require('jQuery');
var _ = require('underscore');
var CONTENT_TYPES = require('../../../constants/contentType');
var BaseView = require('../../../views/baseDialog');
var FileCollection = require('../../../collections/file/collection');
var FileDialogPreviewView = require('../../../views/fileDialog/fileDialog');
var PreviewTemplate = require('../../../../templates/notifications/preview.html');
var LEVEL_CONFIG = require('../../../constants/levelConfig');
var CONSTANTS = require('../../../constants/otherConstants');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.NOTIFICATIONS,

    template: _.template(PreviewTemplate),

    initialize: function (options) {
        this.activityList = options.activityList;
        this.translation = options.translation;
        this.model = options.model;
        this.language = App.currentUser.currentLanguage;

        this.previewFiles = new FileCollection(this.model.get('attachments'), true);

        this.makeRender();
        this.render();
    },

    events : {
        'click .fileThumbnailItem' : 'showFilePreview',
        'click #goToBtn' : 'goTo'
    },

    showFilePreview : function (event) {
        var target = $(event.target);
        var $thumbnail = target.closest('.masonryThumbnail');
        var fileModelId = $thumbnail.attr('data-id');
        var fileModel = this.previewFiles.get(fileModelId);

        this.fileDialogView = new FileDialogPreviewView({
            fileModel  : fileModel,
            translation: this.translation
        });
    },

    render: function () {
        var jsonModel = this.model.toJSON();
        var formString;
        var self = this;
        var currentConfig = this.activityList ? LEVEL_CONFIG[this.contentType].activityList.preview : [];
        jsonModel.currentLanguage = this.language;

        if (jsonModel.type) {
            var notificationTypeObject = CONSTANTS.NOTIFICATION_TYPES.find(function (type) {
                return type._id === jsonModel.type;
            });

            jsonModel.type = notificationTypeObject.name[this.language];
        }

        formString = this.$el.html(this.template({
            jsonModel: jsonModel,
            translation: this.translation
        }));

        this.$el = formString.dialog({
            dialogClass  : 'create-dialog competitorBranding-dialog',
            title        : this.translation.viewNotification,
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

        this.delegateEvents(this.events);
    }
});
