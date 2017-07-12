var $ = require('jQuery');
var _ = require('underscore');
var PreviewTemplate = require('../../../../templates/notes/preView/preView.html');
var BaseView = require('../../../views/baseDialog');
var populate = require('../../../populate');
var CONSTANTS = require('../../../constants/otherConstants');
var CONTENT_TYPES = require('../../../constants/contentType');
var LEVEL_CONFIG = require('../../../constants/levelConfig');
var FileCollection = require('../../../collections/file/collection');
var FileDialogPreviewView = require('../../../views/fileDialog/fileDialog');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.NOTES,

    template : _.template(PreviewTemplate),
    CONSTANTS: CONSTANTS,

    initialize: function (options) {
        this.activityList = options.activityList;
        this.translation = options.translation;
        this.model = options.model;

        this.previewFiles = new FileCollection(this.model.get('attachments'), true);

        this.makeRender();
        this.render();
    },

    events: {
        'click #goToBtn': 'goTo',
        'click .fileThumbnailItem' : 'showFilePreview'
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
        var currentConfig;

        formString = this.$el.html(this.template({
            jsonModel   : jsonModel,
            translation : this.translation,
            activityList: this.activityList
        }));

        this.$el = formString.dialog({
            dialogClass  : 'create-dialog notesPreviewDialog',
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

        this.delegateEvents(this.events);

        return this;
    }
});
