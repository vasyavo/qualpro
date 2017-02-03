define(function (require) {

    var _ = require('underscore');
    var Backbone = require('Backbone');
    var AttachFileView = require('views/objectives/fileDialogView');
    var CONTENT_TYPES = require('constants/contentType');
    var CONSTANTS = require('constants/otherConstants');
    var FileCollection = require('collections/file/collection');
    var FileModel = require('models/documents');
    var Template = require('text!templates/documents/create-file.html');

    return Backbone.View.extend({

        initialize : function (options) {
            this.translation = options.translation;

            this.render();
            this.defineUIElements();
        },

        defineUIElements : function () {
            var context = this.$el;

            this.ui = {
                fileInput : context.find('#file-input'),
            };
        },

        ALLOWED_CONTENT_TYPES: _.union(CONSTANTS.IMAGE_CONTENT_TYPES, CONSTANTS.MS_WORD_CONTENT_TYPES, CONSTANTS.MS_EXCEL_CONTENT_TYPES, CONSTANTS.OTHER_FORMATS, CONSTANTS.VIDEO_CONTENT_TYPES).join(', '),

        template : _.template(Template),

        events : {
            'click #attach-file' : 'showAttachFileView',
            'change #file-input' : 'saveFileInMemory'
        },

        files : new FileCollection(),

        showAttachFileView : function () {
            this.ui.fileInput.click();
        },

        saveFileInMemory : function (event) {
            debugger;
        },

        render : function () {
            var that = this;
            var layout = this.$el.html(this.template({
                translation : this.translation,
                allowedFileTypes : this.ALLOWED_CONTENT_TYPES
            }));

            this.$el = layout.dialog({
                dialogClass : 'create-dialog',
                title        : that.translation.preViewTitle,
                width      : '800',
                height     : '500',
                showCancelBtn: false,
                buttons      : {
                    save  : {
                        text : that.translation.saveBtn,
                        class: 'btn saveBtn',
                        click: function () {
                            alert('currently not implemented!');
                        }
                    },
                    cancel: {
                        text: that.translation.cancelBtn,
                        class: 'btn cancelBtn',
                        click : function () {
                            that.remove();
                        }
                    }
                }
            });
        }

    });

});
