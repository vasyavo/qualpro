var Backbone = require('backbone');
var _ = require('underscore');
var FileFullSizePreview = require('../../views/fileDialog/fileDialog');
var FileModel = require('../../models/file');
var Template = require('../../../templates/documents/preview.html');

module.exports = Backbone.View.extend({

    initialize : function (options) {
        this.translation = options.translation;
        this.model.set('translation', this.translation);

        this.render();
    },

    template : _.template(Template),

    events : {
        'click .fileThumbnailItem' : 'showFullSizeFile'
    },

    showFullSizeFile: function () {
        var attachment = this.model.get('attachment');
        var fileModel = new FileModel(attachment);

        this.fileFullSizeView = new FileFullSizePreview({
            fileModel  : fileModel,
            bucket     : 'documents',
            translation: this.translation
        });

        this.fileFullSizeView.on('download', function (options) {
            var a = document.createElement('a');

            a.download = options.originalName;
            a.href = options.url;
            a.style.display = 'none';

            document.body.appendChild(a);

            a.click();

            document.body.removeChild(a);
            delete a;
        });
    },

    render : function () {
        var self = this;
        var layout = this.$el.html(this.template(this.model.toJSON()));

        this.$el = layout.dialog({
            dialogClass : 'create-dialog',
            title        : this.translation.preViewTitle,
            width        : 'auto',
            height       : 'auto',
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
    }

});
