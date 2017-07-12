var $ = require('jQuery');
var _ = require('underscore');
var Backbone = require('backbone');
var moment = require('moment');
var loginTemplate = require('../../../templates/login/login.html');
var PersonnelModel = require('../../models/personnel');
var custom = require('../../custom');
var CONSTANTS = require('../../constants/validation');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var PubNubClient = require('../../services/pubnub');

module.exports = Backbone.View.extend({
    el      : '#wrapper',
    template: _.template(loginTemplate),

    emailPhoneErrors: {},

    passwordErrors : {},

    initialize: function () {
        delete App.currentUser;

        this.$loader = $('#alaliLogo');
        this.render();
    },

    events    : {
        'submit #loginForm'       : 'login',
        'click .login-button'     : 'login',
        'focus #ulogin'           : 'usernameFocus',
        'focus #upass'            : 'passwordFocus',
        'focusout #ulogin'        : 'usernameFocus',
        'focusout #upass'         : 'passwordFocus',
        'click .remember-me'      : 'checkClick',
        'change #email'           : 'checkEmail',
        'change #pass'            : 'checkPassword',
        'click .onoffswitch-label': 'rememberMe',
        'click #forgotPass'       : 'goForgotPass'
    },

    checkEmail: function (e) {
        var target = $(e.target);
        var value = target.val().trim();

        this.emailPhoneErrors = {};

        if (!value) {
            return this.emailPhoneErrors.emptyEmailPhoneInput = ERROR_MESSAGES.enterYourEmail.en + '<br/>' + ERROR_MESSAGES.enterYourEmail.ar;
        }

        var checkValue = value.replace('+', '');
        checkValue = checkValue.replace('(', '');
        checkValue = checkValue.replace(')', '');

        var isPhone = /^\d+$/.test(checkValue);

        if (isPhone) {
            if (!CONSTANTS.PHONE_REGEXP.test(value) || value.length < 10 || value.length > 15) {
                this.emailPhoneErrors.wrongPhoneValue = ERROR_MESSAGES.login.enterCorrectPhoneNumber.en + '<br>' + ERROR_MESSAGES.login.enterCorrectPhoneNumber.ar;
            }
        } else {
            if (!CONSTANTS.EMAIL_REGEXP.test(value)) {
                this.emailPhoneErrors.wrongEmailValue = ERROR_MESSAGES.login.enterCorrectEmail.en + '<br>' + ERROR_MESSAGES.login.enterCorrectEmail.ar;
            }
        }
    },

    checkPassword : function (event) {
        var target = $(event.target);
        var value = target.val();

        this.passwordErrors = {};

        if (!value) {
            this.passwordErrors.emptyPasswordInput = ERROR_MESSAGES.login.enterYourPassword.en + '<br>' + ERROR_MESSAGES.login.enterYourPassword.ar;
        }
    },

    render: function () {
        var self = this;
        var thisEl = this.$el;

        if (this.$loader.hasClass('smallLogo')) {
            this.$loader
                .removeClass('smallLogo');
            thisEl.html(self.template());
        } else {

            this.$loader
                .addClass('animated');

            setTimeout(function () {
                self.$loader.removeClass('ellipseAnimated');
                thisEl.html(self.template());
            }, 400);
        }

        return this;
    },

    goForgotPass: function (e) {
        var forgotUrl = 'forgotPass';
        e.preventDefault();

        Backbone.history.fragment = '';
        Backbone.history.navigate(forgotUrl, {trigger: true});
    },

    usernameFocus: function (event) {
        this.$el.find('.icon-login').toggleClass('active');
    },

    passwordFocus: function (event) {
        this.$el.find('.icon-pass').toggleClass('active');

    },

    checkClick: function (event) {
        this.$el.find('.remember-me').toggleClass('active');
        if (this.$el.find('#urem').attr('checked')) {
            this.$el.find('#urem').removeAttr('checked');
        } else {
            this.$el.find('#urem').attr('checked', 'checked');
        }
    },

    login: function (event) {
        event.preventDefault();

        var err = this.error = '';
        var self = this;
        var thisEl = this.$el;
        var minimumPassLength = 6;
        var loginForm = thisEl.find('#loginForm');
        var login = _.escape(loginForm.find('#email').val());
        var pass = thisEl.find('#pass').val();
        var checkedEl = thisEl.find('#myonoffswitch');
        var checked = checkedEl.prop('checked');
        var data = {
            login     : login.trim(),
            pass      : pass,
            rememberMe: checked
        };

        var errors = Object.assign({}, self.emailPhoneErrors, self.passwordErrors);
        var errorKeys = Object.keys(errors);

        if (errorKeys.length) {
            errorKeys.map(function (key) {
                if (errors.hasOwnProperty(key)) {
                    App.render({
                        type : 'error',
                        message : errors[key]
                    });
                }
            });

            return;
        }

        loginForm.removeClass('notRegister');

        if (data.pass.length < minimumPassLength) {
            err += ERROR_MESSAGES.passwordLength.en + '</br>' + ERROR_MESSAGES.passwordLength.ar;
        }
        if (err) {
            loginForm.addClass('notRegister');
            return App.render({type: 'error', message: err});
        }
        if (data.login === '') {
            loginForm.addClass('notRegister');
        }

        $.ajax({
            url : '/login',
            type: 'POST',
            data: data,

            success: function () {
                var currentUser;

                self.$loader.addClass('smallLogo');
                if (!App) {
                    App = {};
                }

                if (!App.currentUser) {
                    currentUser = new PersonnelModel();
                    currentUser.url = '/personnel/currentUser';
                    currentUser.fetch({
                        success: function (newCurrentUser) {
                            App.currentUser = newCurrentUser.toJSON();
                            $.datepicker.setDefaults($.datepicker.regional[App.currentUser.currentLanguage]);
                            moment.locale(App.currentUser.currentLanguage);
                            custom.runApplication(true);

                            var userId = App.currentUser._id;

                            PubNubClient.subscribe({
                                userId: userId
                            });
                        },
                        error  : function () {
                            App.render({message: ERROR_MESSAGES.canNotFetchCurrentUser.en + '</br>' + ERROR_MESSAGES.canNotFetchCurrentUser.ar});
                        }
                    });
                }
            },
            error  : function (xhr) {
                var status = xhr.status;

                if (status === 401) {
                    loginForm.addClass('notRegister');
                    App.render({
                        type   : 'error',
                        message: ERROR_MESSAGES.suchUserNotRegistered.en + '</br>' + ERROR_MESSAGES.suchUserNotRegistered.ar
                    });
                } else if (status !== 500) {
                    App.render({type: 'error', message: xhr.responseText});
                } else {
                    App.render({
                        type   : 'error',
                        message: ERROR_MESSAGES.somethingWentWrong.en + '</br>' + ERROR_MESSAGES.somethingWentWrong.ar
                    });
                }

            }
        });
    }
});
