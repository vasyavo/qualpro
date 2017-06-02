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
    'js-cookie'
], function (Backbone, $, _, CONSTANTS, template, baseDialog, EditView, planogramModel, FileDialogPreviewView, FileModel) {

    var PreView = baseDialog.extend({
        contentType   : CONSTANTS.PLANOGRAM,
        imageSrc      : '',
        fileDialogView: {},
        template      : _.template(template),

        events: {
            'click #editPlanogram': 'openEditView',
            'click #imgPreView'   : 'showFilePreviewDialog',
            'click #goToBtn'      : 'goTo',
            'click .file-thumbnail': 'openFullSizeFile'
        },

        initialize: function (options) {
            this.activityList = options.activityList;
            this.model = options.model;
            this.translation = options.translation;

            this.makeRender();
            this.render();
        },

        openFullSizeFile: _.debounce(function (event) {
            var that = this;
            var fileId = $(event.currentTarget).attr('data-file-id');
            var fileModel = new FileModel({
                _id: fileId
            });
            fileModel.id = fileId;

            this.fullSizeFileOverview = new FileDialogPreviewView({
                translation: this.translation,
                fileModel: fileModel
            });
            this.fullSizeFileOverview.on('download', function (options) {
                var url = options.url;
                var originalName = options.originalName;
                var attachmentsContainer = that.$el.find('#product-information-container');

                attachmentsContainer.append('<a id="download-file" class="hidden" href="' + url +  '" download="' + originalName + '"></a>');

                var fileElement = attachmentsContainer.find('#download-file');
                fileElement[0].click();
                fileElement.remove();
            });
        }, 1000, true),

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
            var that = this;
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

            modelJSON.productInfo.forEach(function (fileObject) {
                var content;

                if (/image/.test(fileObject.contentType)) {
                    content = '<img class="file-thumbnail" src="/preview/' + fileObject.preview + '" width="75" data-file-id="' + fileObject._id + '">';
                } else {
                    var fileModel = new FileModel();
                    var fileType = fileModel.getTypeFromContentType(fileObject.contentType);

                    content = '<div class="file-thumbnail iconThumbnail ' + fileType + '" data-file-id="' + fileObject._id + '"></div>';
                }

                that.$el.find('#product-information').append(content);
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return PreView;
});
