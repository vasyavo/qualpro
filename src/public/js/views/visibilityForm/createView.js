define([
    'jQuery',
    'Underscore',
    'common',
    'text!templates/visibilityForm/create.html',
    'models/visibilityForm',
    'views/baseDialog',
    'constants/otherConstants',
    'constants/errorMessages'
], function ($, _, common, CreateTemplate, Model, BaseView, CONSTANTS, ERROR_MESSAGES) {
    'use strict';

    var manageView = BaseView.extend({
        contentType: 'visibilityForm',

        template: _.template(CreateTemplate),

        errors: {},

        events: {
            'change #inputBefore': 'imageTest',
            'submit #mainVisForm': 'formSend'
        },

        initialize: function (options) {

            this.translation = options.translation;
            this.objective = options.objective;
            this.model = new Model();
            this.makeRender();
            this.render();
        },

        formSend: function (e) {
            e.preventDefault();

            var $curEl = this.$el;
            var data = new FormData(e.target);
            var errorsLength = Object.keys(this.errors).length;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
            if (errorsLength) {
                for (var key in this.errors) {
                    App.render(this.errors[key]);
                }

                return false;
            }

            data.append('objective', this.objective);

            $.ajax({
                url        : 'form/visibility',
                type       : 'POST',
                data       : data,
                contentType: false,
                processData: false,
                success    : function () {
                    App.render({type: 'notification', message: ERROR_MESSAGES.successfullySaved[currentLanguage]});
                    $curEl.dialog('close');
                },
                error      : function () {
                    App.render({type: 'error', message: ERROR_MESSAGES.ajaxPostError[currentLanguage]});
                    $curEl.dialog('close');
                }
            });

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
            }
            this.files = input.files;
        },

        saveData: function () {
            var $curEl = this.$el;

            $curEl.find('#mainVisForm').submit();
        },

        render: function () {
            var allowed = CONSTANTS.IMAGE_CONTENT_TYPES.concat(CONSTANTS.VIDEO_CONTENT_TYPES).join(', ');
            var $formString = $(this.template({
                allowed    : allowed,
                translation: this.translation
            }));
            var self = this;

            this.$el = $formString.dialog({
                width      : 'auto',
                dialogClass: 'create-dialog visibilityFormHeight',
                buttons    : {
                    save: {
                        text : self.translation.saveBtn,
                        click: function () {
                            self.saveData();
                        }
                    }
                }
            });

            this.delegateEvents(this.events);
            return this;
        }
    });

    return manageView;
});
