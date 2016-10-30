define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/documents/edit.html',
    'views/baseDialog',
    'models/documents',
    'constants/contentType'
], function (Backbone, _, $, EditTemplate, BaseView, Model, CONTENT_TYPES) {
    'use strict';

    var CreateView = BaseView.extend({
        contentType: CONTENT_TYPES.DOCUMENTS,
        template   : _.template(EditTemplate),
        body       : {},

        initialize: function (options) {
            this.model = options.model;
            this.translation = options.translation;

            this.makeRender();
            this.render();

            _.bindAll(this, 'render');

        },

        saveDocument: function (cb) {
            var self = this;
            var $curEl = this.$el;
            var model = this.model;
            var title = $curEl.find('#titleDd').val();

            if (title !== model.get('title')) {
                this.body.title = title;
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

                        self.saveDocument(function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                },
                cancel: {
                    text: this.translation.cancelBtn
                }
            };

            formString = this.template({jsonModel: jsonModel, translation: this.translation});

            this.$el = $(formString).dialog({
                dialogClass: 'create-dialog',
                title      : this.translation.editTitle,
                width      : 'auto',
                height     : 'auto',
                buttons    : buttons
            });

            $curEl = this.$el;

            $curEl.find('#mainForm').on('submit', {body: this.body, context: this}, this.formSubmit);

            $curEl.find('.objectivesTextarea').each(function (index, element) {
                var $element = $(element);

                $element.ckeditor({language: $element.attr('data-property')});
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return CreateView;
});
