var $ = require('jQuery');
var _ = require('underscore');
var Backbone = require('backbone');
var moment = require('moment');
var MainTemplate = require('text!templates/main/main.html');
var LeftMenuView = require('views/menu/left');
var MenuItemsCollection = require('models/module');
var TopMenuView = require('views/menu/topMenu');
var dataService = require('dataService');
var custom = require('custom');
var PersonnelModel = require('models/personnel');
var ERROR_MESSAGES = require('constants/errorMessages');

module.exports = Backbone.View.extend({
    el      : '#wrapper',
    template: _.template(MainTemplate),
    events  : {
        'click #loginPanel': 'showSelect'
    },

    initialize: function (options) {
        this.contentType = options ? options.contentType : null;
        this.render();
        this.collection = new MenuItemsCollection({parse: true});
        this.collection.bind('reset', this.createMenuViews, this);
    },

    createTopMenu: function () {
        var self = this;
        this.topMenu = new TopMenuView({
            contentType: this.contentType
        });

        this.topMenu.on('languageChanged', function () {
            self.collection.parse(self.collection);
            self.leftMenu.render();
            self.trigger('languageChanged');
        });

        this.topMenu.on('translationLoaded', function (translation) {
            self.trigger('translationLoaded', translation);
        });
    },

    createMenuViews: function () {
        if (this.leftMenu) {
            this.leftMenu.undelegateEvents();
        }
        this.leftMenu = new LeftMenuView({
            collection: this.collection
        });
    },

    render: function () {
        var currentUser;

        this.$el.mCustomScrollbar({axis: 'yx'});
        this.$el.html(this.template());

        this.createTopMenu();

        if (!App) {
            App = {};
        }
        if (!App.currentUser) {
            currentUser = new PersonnelModel();
            currentUser.bind('reset', this.topMenu.renderCurrentUserInfo, this.topMenu);
            currentUser.url = '/personnel/currentUser';
            currentUser.fetch({
                success: function (newCurrentUser) {
                    App.currentUser = newCurrentUser.toJSON();
                    $.datepicker.setDefaults($.datepicker.regional[App.currentUser.currentLanguage]);
                    moment.locale(App.currentUser.currentLanguage);
                    currentUser.trigger('reset');
                },
                error  : function () {
                    App.render({
                        type   : 'error',
                        message: ERROR_MESSAGES.canNotFetchCurrentUser.en + '</br>' + ERROR_MESSAGES.canNotFetchCurrentUser.ar
                    });
                }
            });
        } else {
            this.topMenu.renderCurrentUserInfo();
        }

        return this;
    }
});
