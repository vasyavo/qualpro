define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/notes/edit.html',
    'views/baseDialog',
    'models/notes',
    'constants/contentType'
], function (Backbone, _, $, EditTemplate, BaseView, Model, CONTENT_TYPES) {
    'use strict';

    var CreateView = BaseView.extend({
        contentType: CONTENT_TYPES.NOTES,

        template: _.template(EditTemplate),

        events: {},

        initialize: function (options) {

            this.model = options.model;
            this.translation = options.translation;

            this.makeRender();
            this.render();
        },

        saveNote: function (cb) {
            var self = this;
            var $curEl = this.$el;
            var theme = $curEl.find('#themeDb').val();
            var title = $curEl.find('#titleDb').val();
            var description = $curEl.find('.noteTextarea[data-property="en"]').val();
            this.body = {};

            if (theme !== this.model.get('theme')) {
                this.body.theme = theme;
            }
            if (title !== this.model.get('title')) {
                this.body.title = title;
            }
            if (description !== this.model.get('description')) {
                this.body.description = description;
            }

            if (!Object.keys(this.body).length) {
                return cb();
            }

            this.model.setFieldsNames(this.translation, this.body);

            this.model.validate(this.body, function (err) {
                if (err && err.length) {
                    App.renderErrors(err);
                } else {
                    self.$el.find('#mainForm').submit();
                    cb();
                }
            });
        },

        formSubmit: function (e) {
            var context = e.data.context;
            var data = new FormData(this);
            var ajaxData = {
                data       : data,
                contentType: false,
                processData: false,
                success    : function (xhr) {
                    var model = new Model(xhr, {parse: true});

                    context.trigger('modelSaved', model);
                }
            };

            e.preventDefault();

            context.body.attachments = context.attachments;
            ajaxData.url = context.model.url();
            ajaxData.type = 'PUT';

            data.append('data', JSON.stringify(context.body));

            $.ajax(ajaxData);
        },

        render: function () {
            var jsonModel = this.model.toJSON();
            var formString;
            var self = this;
            var $curEl;

            var buttons = {
                save  : {
                    text : this.translation.saveBtn,
                    class: 'btn saveBtn',
                    click: function () {
                        var that = this;
                        self.saveNote(function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                },
                cancel: {
                    text: this.translation.cancelBtn
                }
            };

            formString = this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            });

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog notesDialog',
                title      : this.translation.editTitle,
                width      : '1000',
                buttons    : buttons
            });

            $curEl = this.$el;

            $curEl.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);

            $curEl.find('.noteTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;
});
