'use strict';

define([
    'backbone',
    'jQuery',
    'Underscore',
    'constants/contentType',
    'text!templates/planogram/preView/preView.html',
    'views/baseDialog',
    'views/planogram/editView',
    'models/planogram',
    'views/fileDialog/fileDialog',
    'models/file',
    'populate',
    'common',
    'constants/otherConstants',
    'constants/validation',
    'js-cookie'
], function (Backbone, $, _, CONSTANTS, template, baseDialog, EditView, planogramModel, FileDialogPreviewView,
             FileModel, populate, common) {

    var PreView = baseDialog.extend({
        contentType   : CONSTANTS.PLANOGRAM,
        imageSrc      : '',
        fileDialogView: {},
        template      : _.template(template),

        events: {
            'click #editPlanogram': 'openEditView',
            'click #imgPreView'   : 'showFilePreviewDialog',
            'click #goToBtn'      : 'goTo'
        },

        initialize: function (options) {

            this.activityList = options.activityList;
            this.model = options.model;
            this.translation = options.translation;
            //this.contentType = CONSTANTS.PLANOGRAM;

            this.makeRender();
            this.render();
        },

        showFilePreviewDialog: _.debounce(function () {
            var fileModel = new FileModel(this.model.attributes.fileID, {parse: true});
            this.fileDialogView = new FileDialogPreviewView({
                translation: this.translation,
                fileModel  : fileModel,
                bucket     : this.contentType
            });
        }, 1000, true),

        openEditView: function () {
            var self = this;
            var editView = new EditView({
                translation: this.translation,
                model      : self.model
            });

            editView.on('modelSaved', function (model) {
                const jsonModel = model.toJSON();

                jsonModel.retailSegmentString = jsonModel.retailSegment.map((item) => {
                    return item.name.currentLanguage;
                }).join(', ');

                self.$el.html(self.template({
                    translation: self.translation,
                    model      : jsonModel,
                    activityList : self.activityList
                }));
                self.trigger('modelSaved', model);
            })
        },

        render: function () {
            var modelJSON = this.model.toJSON();

            modelJSON.retailSegmentString = modelJSON.retailSegment.map((item) => {
                return item.name.currentLanguage;
            }).join(', ');

            this.$el.html(this.template({
                translation : this.translation,
                model       : modelJSON,
                activityList: this.activityList
            }));

            this.$el = this.$el.dialog({
                dialogClass  : 'previewDialog',
                title        : this.translation.previewPlanogram,
                showCancelBtn: false,
                height       : '80%',
                buttons      : {
                    save: {
                        text : this.translation.okBtn,
                        click: function () {
                            $(this).dialog('close').dialog('destroy').remove();
                        }
                    }
                }
            });
            this.delegateEvents(this.events);

            return this;
        }
    });

    return PreView;
});
