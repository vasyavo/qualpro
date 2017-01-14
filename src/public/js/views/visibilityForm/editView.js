define([
    'jQuery',
    'Underscore',
    'common',
    'text!templates/visibilityForm/edit.html',
    'text!templates/visibilityForm/editAfter.html',
    'models/visibilityForm',
    'views/baseDialog',
    'constants/otherConstants',
    'constants/errorMessages'
], function ($, _, common, EditTemplate, EditAfterTemplate, Model, BaseView, CONSTANTS, ERROR_MESSAGES) {

    var manageView = BaseView.extend({
        contentType: 'visibilityForm',

        template     : _.template(EditTemplate),
        templateAfter: _.template(EditAfterTemplate),

        errors: {},

        events: {
            'change #inputBefore': 'imageTest',
            'change #inputAfter' : 'imageTest',
            'click #removeFile'  : 'removeFile'
        },

        initialize: function (options) {
            var self = this;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

            options = options || {};

            this.forCreate = options.forCreate;
            this.translation = options.translation;
            this.description = options.description[currentLanguage];
            this.branchName = options.branchName || '';
            this.editAfter = options.editAfter;
            this.oldAjaxObj = options.oldAjaxObj;
            this.filesIdToDeleted = [];

            if (this.forCreate) {
                if (options.savedVisibilityModel) {
                    this.model = options.savedVisibilityModel;
                } else {
                    this.model = new Model();
                }

                self.makeRender();
                self.render();
            } else {
                if (options.savedVisibilityModel) {
                    this.model = options.savedVisibilityModel;
                    self.makeRender();
                    self.render();
                } else {
                    this.model = new Model({_id: options.id});

                    this.model.fetch({
                        success: function () {
                            self.makeRender();
                            self.render();
                        },
                        error  : function () {
                            App.render({type: 'error', message: ERROR_MESSAGES.readError[currentLanguage]});
                        }
                    });
                }
            }

        },

        removeFile: function (e) {
            var $target = $(e.target);
            var $targetImg = $target.next('#imageMy');
            var targetClass = $target.closest('.partType');
            var classWithFileId = $target.closest('.bannerBig');
            var fileId = classWithFileId.attr('id');
            var filesInModelFromInput = this.model.get('files');
            $target.addClass('hidden');
            this.editBefore = targetClass.hasClass('beforeEdit');
            this.filesIdToDeleted.push(fileId);
            if (filesInModelFromInput) {
                this.model.set('files', []);
            }

            $targetImg.html('');
        },

        formSend: function (e) {
            var context = e.data.context;
            var data = new FormData(this);
            var $curEl = context.$el;
            var errorsLength = Object.keys(context.errors).length;
            var ajaxObj;
            var newAfterDescription;
            e.preventDefault();

            if (errorsLength) {
                for (var key in context.errors) {
                    App.render(context.errors[key]);
                }

                return false;
            }

            if (context.editAfter) {
                newAfterDescription = $curEl.find('#afterForm').val();

                if (context.newFileUploaded || !context.oldAjaxObj) {
                    context.model.set('descriptionAfter', newAfterDescription);

                    ajaxObj = {
                        model      : context.model,
                        url        : 'form/visibility/' + context.model.get('_id'),
                        type       : 'PATCH',
                        data       : data,
                        contentType: false,
                        processData: false
                    };
                } else {
                    if (newAfterDescription !== context.model.get('after').description) {
                        context.model.set('descriptionAfter', newAfterDescription);

                        if (context.oldAjaxObj) {
                            context.oldAjaxObj.data.set('description', newAfterDescription);
                            context.oldAjaxObj.model = context.model;
                        }

                        ajaxObj = context.oldAjaxObj;
                    }
                }

            } else {
                data.append('before', 'true');
                if (context.newFileUploaded) {
                    ajaxObj = {
                        model      : context.model,
                        url        : 'form/visibility/' + context.model.get('_id'),
                        type       : 'PATCH',
                        data       : data,
                        contentType: false,
                        processData: false
                    };
                } else if (context.filesIdToDeleted.length) {
                    var description = context.model.get('before');
                    description = description.description;
                    context.model.set('before', {files: {}, description: description});
                    data = new FormData();
                    data.append('data', JSON.stringify({isNewFile: []}));
                    data.append('before', 'true');

                    ajaxObj = {
                        model      : context.model,
                        url        : 'form/visibility/before/' + context.model.get('_id'),
                        type       : 'PATCH',
                        data       : data,
                        contentType: false,
                        processData: false
                    };
                }
            }

            if (ajaxObj) {
                context.trigger('visibilityFormEdit', ajaxObj);
            }

            this.newFileUploaded = false;

            $curEl.dialog('close').dialog('destroy').remove();

        },

        imageIsLoaded: function (e) {
            var res = e.target.result;
            var container;
            var type = res.substr(0, 10);

            if (type === 'data:video') {
                container = '<video width="400" controls><source src="' + res + '"></video>';
            } else {
                container = '<img id="myImg" class="imgResponsive" src="' + res + '">';
            }

            if (this.editAfter) {
                this.model.set('filesAfter', {
                    url        : res,
                    contentType: type.substr(5, 5)
                });
            } else {
                this.model.set('files', {
                    url        : res,
                    contentType: type.substr(5, 5)
                });
            }

            this.$el.find('#imageMy').html(container);
        },

        imageTest: function (e) {
            e.preventDefault();

            var self = this;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
            var input = e.target;
            var fileSizeMax = 20000000;
            var reader;
            var file;
            var error;

            if (input.files && input.files[0]) {
                file = input.files[0];
                if (file.size > fileSizeMax) {
                    App.render({type: 'alert', message: ERROR_MESSAGES.fileSizeLimitReached[currentLanguage]});

                    this.errors = {file: error};
                } else {
                    delete this.errors.file;
                }

                reader = new FileReader();

                reader.readAsDataURL(input.files[0]);
                reader.onload = _.bind(self.imageIsLoaded, self);
                this.newFileUploaded = true;
            }
            this.files = input.files;
            this.$el.find('#removeFile').removeClass('hidden');
        },

        saveData: function () {
            this.$el.find('#mainVisForm').submit();
        },

        render: function () {
            var allowed = CONSTANTS.IMAGE_CONTENT_TYPES.concat(CONSTANTS.VIDEO_CONTENT_TYPES).join(', ');
            var self = this;
            var $formString;
            var before = this.model.get('before') || {};
            var after = this.model.get('after') || {};
            var savedFiles = this.model.get('files');
            var savedAfterFiles = this.model.get('filesAfter');
            var descriptionAfter = this.model.get('descriptionAfter');
            var files = savedFiles ? savedFiles : before.files || {};
            var filesAfter = savedAfterFiles ? savedAfterFiles : after.files || {};

            if (this.editAfter) {
                descriptionAfter = descriptionAfter ? descriptionAfter : after.description || '';

                this.model.set({
                    after: {
                        description: descriptionAfter,
                        files      : filesAfter
                    }
                });

                this.model.set({
                    before: {
                        description: this.description,
                        files      : before.files[0]
                    }
                });

                $formString = $(self.templateAfter({
                    model      : this.model.toJSON(),
                    branchName : this.branchName,
                    allowed    : allowed,
                    translation: this.translation
                }));
            } else {
                this.model.set({
                    before: {
                        description: this.description,
                        files      : files[0]
                    }
                });

                $formString = $(self.template({
                    model      : this.model.toJSON(),
                    branchName : this.branchName,
                    allowed    : allowed,
                    translation: this.translation
                }));
            }

            this.$el = $formString.dialog({
                width      : 'auto',
                dialogClass: 'edit-dialog visibilityFormHeight',
                buttons    : {
                    save: {
                        text : self.translation.saveBtn,
                        click: function () {
                            self.saveData();
                        }
                    },

                    cancel: {
                        text : self.translation.cancelBtn,
                        click: function () {
                            self.model.set('files', []);
                        }
                    }
                }
            });
            this.$el.find('#mainVisForm').on('submit', {context: this}, this.formSend);


            if (!Object.keys(files).length) {
                this.$el.find('#removeFile').addClass('hidden');
            }

            this.delegateEvents(this.events);
            return this;
        }
    });
    return manageView;
});
