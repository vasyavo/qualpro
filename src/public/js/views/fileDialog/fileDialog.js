define([
    'jQuery',
    'underscore',
    'text!templates/fileDialog/fileDialog.html',
    'views/baseDialog',
    'constants/errorMessages'
], function ($, _, FileDialogTemplate, BaseView, ERROR_MESSAGES) {

    var FileDialog = BaseView.extend({
        contentType: 'fileDialog',
        template   : _.template(FileDialogTemplate),

        events: {},

        initialize: function (options) {
            var self = this;
            var bucket;
            var currentLanguage = App.currentUser.currentLanguage;

            options = options || {};

            this.fileModel = options.fileModel;

            if (!this.fileModel || !this.fileModel.id) {
                return App.render({type: 'alert', message: ERROR_MESSAGES.fileIsNotUploaded[currentLanguage]});
            }

            if (!this.fileModel.get('originalName')) {
                this.fileModel.set('originalName', this.fileModel.get('name'));
            }

            bucket = options.bucket || 'objectives';

            this.makeRender();

            this.fileOrifginalName = this.fileModel.get('originalName');

            if (!this.fileModel.get('url')) {
                this.fileModel.getUrl(bucket, function (err, result) {
                    if (err) {
                        return App.render({type: 'error', message: err.message});
                    }

                    self.fileUrl = result.url;
                    self.fileModel.set('originalName', result.originalName);
                    self.fileModel.set('type', self.fileModel.getTypeFromContentType(result.contentType));
                    self.fileModel.set('contentType', result.contentType);
                    self.fileOrifginalName = result.originalName;
                    self.render();
                });
            } else {
                this.fileUrl = this.fileModel.get('url');
                this.render();
            }
        },

        render: function () {
            var type = this.fileModel.get('type');
            var options;

            if (['word_icon', 'excel_icon'].indexOf(type) !== -1) {
                options = {
                    url         : this.fileUrl,
                    originalName: this.fileOrifginalName
                };
                return this.trigger('download', options);
            }
            var $formString = $(this.template({
                fileName: this.fileModel.get('originalName'),
                type    : type
            }));

            $formString
                .find('#downloadButton')
                .attr({href: this.fileUrl})
                .attr('download', this.fileOrifginalName);

            if (type === 'video_icon') {
                $formString.find('#video').attr({
                    type: this.fileModel.get('contentType'),
                    src : this.fileUrl
                });
            } else if (type === 'image_icon') {
                $formString.find('#image').attr({
                    src: this.fileUrl
                });
            } else if (type === 'pdf_icon') {
                $formString.find('#pdf').attr({
                    type: this.fileModel.get('contentType'),
                    data: this.fileUrl
                });
            }

            this.$el = $formString.dialog({
                dialogClass: 'file-dialog mediaDilog',
                title      : 'File Dialog'
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return FileDialog;
});
