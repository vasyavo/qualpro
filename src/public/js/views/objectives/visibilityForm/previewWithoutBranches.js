define(function (require) {

    var $ = require('jQuery');
    var _ = require('Underscore');
    var Backbone = require('Backbone');
    var VisibilityFormModel = require('models/visibilityForm');
    var ERROR_MESSAGES = require('constants/errorMessages');
    var Template = require('text!templates/objectives/visibilityForm/previewWithOutBranches.html');

    return Backbone.View.extend({

        initialize : function (options) {
            var that = this;

            this.translation = options.translation;
            this.templateOptions = {
                translation : this.translation,
                beforeDescription : options.beforeDescription,
                location : options.location
            };

            this.model = new VisibilityFormModel({
                _id : options.formId
            });
            this.model.fetch({
                success: function () {
                    that.render();
                },
                error  : function () {
                    App.render({
                        type : 'error',
                        message : ERROR_MESSAGES.readError[App.currentUser.currentLanguage]
                    });
                }
            });
        },

        template : _.template(Template),

        render : function () {
            var that = this;
            var beforeFileData = this.getBeforeFileData();
            var afterFileData = this.getAfterFileData();

            var layout = $(this.template(
                Object.assign({}, that.templateOptions, beforeFileData, afterFileData)
            ));

            this.$el = layout.dialog({
                showCancelBtn : false,
                width : 'auto',
                dialogClass : 'create-dialog visibilityFormHeight',
                buttons : {
                    save : {
                        text : that.translation.okBtn,
                        click : function () {
                            that.$el.dialog('close').dialog('destroy').remove();
                        }
                    }
                }
            });

            this.delegateEvents(this.events);
        },

        getBeforeFileData : function () {
            var data = {};
            var fileContainer;
            var file = this.model.get('before').files[0];
            var fileType = file.contentType.substring(0, 5);

            if (fileType === 'video') {
                fileContainer = '<video class="showPreview before" width="400" controls><source src="' + file.url + '"></video>';
            } else {
                fileContainer = '<img class="imgResponsive showPreview before" src="' + file.url + '">';
            }

            data.beforeFileContainer = fileContainer;
            data.beforeFileName = file.originalName;

            return data;
        },

        getAfterFileData : function () {
            var data = {};
            var fileContainer;
            var file = this.model.get('after').files[0];
            if (file) {
                var fileType = file.contentType.substring(0, 5);

                if (fileType === 'video') {
                    fileContainer = '<video class="showPreview before" width="400" controls><source src="' + file.url + '"></video>';
                } else {
                    fileContainer = '<img class="imgResponsive showPreview before" src="' + file.url + '">';
                }

                data.beforeFileContainer = fileContainer;
                data.beforeFileName = file.originalName;
            }

            var description = this.model.get('after').description;

            data.afterDescription = description;

            return data;
        }

    });

});
