define(function (require) {

    var $ = require('jQuery');
    var _ = require('Underscore');
    var Backbone = require('backbone');
    var CONSTANTS = require('constants/otherConstants');
    var ERROR_MESSAGES = require('constants/otherConstants');
    var Template = require('text!templates/objectives/visibilityForm/editWithoutBranches.html');

    return Backbone.View.extend({

        initialize : function (options) {
            var that = this;
            this.translation = options.translation;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

            this.templateOptions = {
                translation : this.translation,
                description : $(options.description[currentLanguage]).text(),
                locationString : options.locationString,
                fileContainer : '',
                allowed : CONSTANTS.IMAGE_CONTENT_TYPES.concat(CONSTANTS.VIDEO_CONTENT_TYPES).join(', ')
            };

            this.render();
            this.defineUiElements();
            this.showPreviewOfSavedFile(options.previewOfSelectedFile);
        },

        defineUiElements : function () {
            var view = this.$el;
            this.ui = {
                filePreviewHolder : view.find('#imageMy'),
                removeFileButton : view.find('#remove')
            };
        },

        showPreviewOfSavedFile : function (preview) {
            if (preview) {
                this.ui.removeFileButton.removeClass('hidden');
                this.ui.filePreviewHolder.html(preview);
            }
        },

        template : _.template(Template),

        deleteSavedFile : false,

        selectedTempFile : {},

        events : {
            'change #photo' : 'saveFile',
            'click #remove' : 'removeFile'
        },

        saveFile : function (event) {
            var that = this;
            var file = event.target.files[0];
            var fileReader = new FileReader();

            fileReader.readAsDataURL(file);
            fileReader.onload = function(fileReaderEvent) {
                var container;
                var fileAsBase64String = fileReaderEvent.target.result;
                var fileType = fileAsBase64String.substr(0, 10);

                if (fileType === 'data:video') {
                    container = '<video width="400" controls><source src="' + fileAsBase64String + '"></video>';
                } else {
                    container = '<img id="myImg" class="imgResponsive" src="' + fileAsBase64String + '">';
                }

                that.selectedTempFile.preview = container;

                that.deleteSavedFile = false;

                that.ui.filePreviewHolder.html(container);
                that.ui.removeFileButton.removeClass('hidden');
            };

            that.selectedTempFile.file = file;
        },

        removeFile : function () {
            this.selectedTempFile = {};
            this.deleteSavedFile = true;
            this.ui.filePreviewHolder.html('');
            this.ui.removeFileButton.addClass('hidden');
        },

        render : function () {
            var that = this;
            var layout = $(that.template(that.templateOptions));

            that.$el = layout.dialog({
                width : 'auto',
                dialogClass : 'edit-dialog visibilityFormHeight',
                buttons : {
                    save : {
                        text : that.translation.saveBtn,
                        click : that.onSave.bind(that)
                    },
                    cancel : {
                        text : that.translation.cancelBtn
                    }
                }
            });

            this.delegateEvents(this.events);
        },

        onSave : function () {
            if (this.selectedTempFile.file) {
                this.trigger('save', this.selectedTempFile);
            }

            if (this.deleteSavedFile) {
                this.trigger('delete-file');
            }

            this.$el.dialog('close').dialog('destroy').remove();
        }

    });

});