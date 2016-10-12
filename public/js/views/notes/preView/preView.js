define([
        'Backbone',
        'Underscore',
        'jQuery',
        'text!templates/notes/preView/preView.html',
        'models/notes',
        'views/baseDialog',
        'populate',
        'constants/otherConstants',
        'constants/contentType',
        'constants/levelConfig'
    ],
    function (Backbone, _, $, PreviewTemplate, Model, BaseView, populate, CONSTANTS, CONTENT_TYPES,
              LEVEL_CONFIG) {
        'use strict';

        var PreviewView = BaseView.extend({
            contentType: CONTENT_TYPES.NOTES,

            template : _.template(PreviewTemplate),
            CONSTANTS: CONSTANTS,

            events: {
                'click #goToBtn': 'goTo'
            },

            initialize: function (options) {

                this.activityList = options.activityList;
                this.translation = options.translation;
                this.model = options.model;

                this.makeRender();
                this.render();
            },

            render: function () {
                var jsonModel = this.model.toJSON();
                var formString;
                var self = this;
                var currentConfig;

                formString = this.$el.html(this.template({
                    jsonModel   : jsonModel,
                    translation : this.translation,
                    activityList: this.activityList
                }));

                this.$el = formString.dialog({
                    dialogClass  : 'create-dialog notesPreviewDialog',
                    title        : this.translation.preViewTitle,
                    width        : '1000',
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

                if (this.activityList) {
                    currentConfig = LEVEL_CONFIG[this.contentType].activityList.preview[0];

                    require([
                            currentConfig.template
                        ],
                        function (template) {
                            var container = self.$el.find(currentConfig.selector);

                            template = _.template(template);

                            if (!container.find('#' + currentConfig.elementId).length) {
                                container[currentConfig.insertType](template({
                                    elementId  : currentConfig.elementId,
                                    translation: self.translation
                                }));
                            }
                        });
                }

                this.delegateEvents(this.events);

                return this;
            }
        });

        return PreviewView;
    });