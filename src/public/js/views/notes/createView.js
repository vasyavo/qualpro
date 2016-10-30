define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/notes/create.html',
    'views/baseDialog',
    'views/objectives/fileDialogView',
    'models/notes',
    'constants/contentType'
], function (Backbone, _, $, CreateTemplate, BaseView, FileDialogView, Model, CONTENT_TYPES) {
    'use strict';

    var CreateView = BaseView.extend({
        contentType: CONTENT_TYPES.NOTES,

        template: _.template(CreateTemplate),

        events: {},

        initialize: function (options) {

            this.locationFilter = {};
            this.model = new Model();
            this.translation = options.translation;

            this.makeRender();
            this.render();
        },

        saveNote: function (cb) {
            var self = this;
            var $curEl = this.$el;

            this.body = {
                theme      : $curEl.find('#themeDb').val(),
                title      : $curEl.find('#titleDb').val(),
                description: $curEl.find('.noteTextarea[data-property="en"]').val()
            };

            this.model.setFieldsNames(this.translation);

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

            e.preventDefault();
            data.append('data', JSON.stringify(context.body));

            $.ajax({
                url        : context.model.urlRoot(),
                type       : 'POST',
                data       : data,
                contentType: false,
                processData: false,
                success    : function (xhr) {
                    var model = new Model(xhr, {parse: true});

                    context.trigger('modelSaved', model);
                }
            });
        },

        render: function () {
            var jsonModel = this.model.toJSON();
            var formString = this.template({
                jsonModel  : jsonModel,
                translation: this.translation
            });
            var self = this;

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog full-height-dialog notesDialog',
                title      : this.translation.createTitle,
                width      : '1000',
                buttons    : {
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
                }
            });

            this.$el.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);

            this.$el.find('.noteTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;
});

