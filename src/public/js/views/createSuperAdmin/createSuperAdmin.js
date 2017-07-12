var $ = require('jQuery');
var _ = require('underscore');
var Backbone = require('backbone');
var dataService = require('../../dataService');
var createSuperAdminTemplate = require('../../../templates/createSuperAdmin/createSuperAdmin.html');
var ERROR_MESSAGES = require('../../constants/errorMessages');

module.exports = Backbone.View.extend({
    el      : '#wrapper',
    template: _.template(createSuperAdminTemplate),

    initialize: function () {
        this.render();
    },

    events: {
        'submit #loginForm': 'createSuperAdmin'
    },

    createSuperAdmin: function (e) {
        var $el = $(e.target);
        var repeatPassword = $el.find('input[name="repeatPassword"]').val();
        var data = {
            email: $el.find('input[name="email"]').val(),
            pass : $el.find('input[name="password"]').val()
        };
        var currentUser = App.currentUser;
        var currentLanguage = currentUser && currentUser.currentLanguage || 'en';

        e.preventDefault();

        if (!data.email || !(data.pass === repeatPassword) || !data.pass) {
            return App.render({type: 'error', message: ERROR_MESSAGES.notValidData[currentLanguage]});
        }

        dataService.postData('/personnel/createSuper', data, function (err, res) {
            if (err) {
                return App.render(err);
            }

            App.render({type: 'notification', message: ERROR_MESSAGES.checkYourEmail[currentLanguage]});
        });
    },

    render: function () {
        var thisEl = this.$el;
        thisEl.html(this.template());

        this.$errrorHandler = $('#errorHandler');

        return this;
    }
});
