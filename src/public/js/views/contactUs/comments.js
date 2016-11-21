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
            const self = this;
            let commentInput = this.$el.find('#comment');
            let comment = commentInput.val();
            if (comment) {
                dataService.putData(`contactUs/${this.modelAttrs._id}`, {
                    comment : comment
                }, (err, response) => {
                    if (err) {
                        App.renderErrors([
                            ERROR_MESSAGES.commentNotAdded[App.currentUser.currentLanguage]
                        ]);
                    }

                    commentInput.val('');

                    let WrapCommentDiv = document.createElement('div');
                    WrapCommentDiv.className = 'ui-dialog-content ui-widget-content templateWrap';

                    let innerDiv = document.createElement('div');
                    innerDiv.className = 'commentBlock flrow flexColumn';

                    let span = document.createElement('span');
                    span.innerHTML = comment;

                    innerDiv.appendChild(span);
                    WrapCommentDiv.appendChild(innerDiv);

                    this.$el.find('#comments-holder').append(WrapCommentDiv);
                });
            }
        },

        render: function () {
            const self = this;
            dataService.getData(`contactUs/${this.modelAttrs._id}`, {}, (err, response) => {
                if (err) {
                    return App.renderErrors([
                        ERROR_MESSAGES.statusNotChanged[App.currentUser.currentLanguage]
                    ]);
                }

                var formString;

                formString = self.$el.html(self.template({
                    comments  : response.comments,
                    translation: self.translation
                }));

                self.$el = formString.dialog({
                    dialogClass  : 'ui-dialog ui-widget ui-widget-content ui-corner-all ui-front ui-dialog-buttons ui-draggable allDialogsClass create-dialog dialog-small',
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