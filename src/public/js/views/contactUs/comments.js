define(function (require) {

    const $ = require('jquery');
    const _ = require('underscore');
    const BaseDialog = require('views/baseDialog');
    const dataService = require('dataService');
    const ERROR_MESSAGES = require('constants/errorMessages');
    const CommentsTemplate = require('text!templates/contactUs/comments.html');

    const CommentsView = BaseDialog.extend({

        initialize : function (options) {
            this.modelAttrs = options.modelAttrs;
            this.translation = options.translation;

            this.render();
        },

        template: _.template(CommentsTemplate),

        saveComment : function () {
            let comment = this.$el.find('#comment').val();
            if (comment) {
                dataService.putData(`contactUs/${this.modelAttrs._id}`, {
                    comment : comment
                }, (err, response) => {
                    debugger;
                    //todo render added comment
                });
            }
        },

        render: function () {
            const self = this;
            dataService.getData('comment', {
                objectiveId : this.modelAttrs._id
            }, (err, response) => {
                if (err) {
                    return App.renderErrors([
                        ERROR_MESSAGES.statusNotChanged[App.currentUser.currentLanguage]
                    ]);
                }

                var formString;

                formString = self.$el.html(self.template({
                    comments  : response.data,
                    translation: self.translation
                }));

                self.$el = formString.dialog({
                    dialogClass  : 'create-dialog competitorBranding-dialog',
                    width        : '700',
                    showCancelBtn: true,
                    buttons      : {
                        save: {
                            text : self.translation.sendBtn,
                            class: 'btn saveBtn',
                            click: function () {
                                self.undelegateEvents();
                                self.saveComment();
                            }
                        }
                    },

                    close: function () {
                        var model = self.model;
                        var id;
                        var previousAttributes;

                        if (model.changedAttributes()) {
                            id = model.get('_id');
                            previousAttributes = model.previousAttributes();
                            model.clear();
                            model.set(previousAttributes);
                            model.set({_id: id});
                        }

                        $('body').css({overflow: 'inherit'});
                    }
                });

                self.delegateEvents(this.events);
            });

        }

    });

    return CommentsView;

});