var _ = require('underscore');
var Backbone = require('backbone');
var MESSAGES = require('../constants/popUpMessages');
var template = require('../../templates/main/popUp.html');
var App = require('../appState');

module.exports = Backbone.View.extend({
    contentType: 'PopUp',
    imageSrc   : '',
    template   : _.template(template),

    events: {},

    initialize: function (options) {
        this.render(options);
    },

    render: function (options) {
        options = options || {};

        var contentType = options.contentType;
        var action = options.action;
        var title = '';
        var message = '';
        var saveCb = options.saveCb;
        var saveTitle = options.saveTitle || 'OK';
        var showCancelBtn = options.showCancelBtn || true;
        var iconClass = options.iconClass || '';
        var buttons = {};
        var dialogOptions;
        var CONTENT;
        var ACTION;
        var currentLanguage = App.currentUser.currentLanguage;

        if (contentType) {
            CONTENT = MESSAGES[contentType];

            if (CONTENT) {
                ACTION = CONTENT[action];

                if (ACTION) {
                    title = ACTION.title[currentLanguage];
                    message = ACTION.message[currentLanguage];
                }
            }
        }

        if (saveCb) {
            buttons.save = {
                text : saveTitle,
                click: saveCb
            };
        }

        dialogOptions = {
            dialogClass  : 'popUpDialog',
            title        : title,
            showCancelBtn: showCancelBtn,
            height       : '80%',
            buttons      : buttons
        };

        this.$el.html(this.template({message: message, title: title, iconClass: iconClass}));
        this.$el = this.$el.dialog(dialogOptions);
        this.delegateEvents(this.events);

        return this;
    }
});
