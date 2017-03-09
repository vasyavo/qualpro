define([
    'backbone',
    'jQuery',
    'text!templates/forgotPassword/forgotPassword.html',
    'custom',
    'constants/validation',
    'constants/errorMessages'
], function (Backbone, $, forgotTemplate, custom, CONSTANTS, ERROR_MESSAGES) {

    var LoginView = Backbone.View.extend({
        el            : '#wrapper',
        template      : _.template(forgotTemplate),
        $errrorHandler: null,

        errors: {
            emptyPhoneInput : ERROR_MESSAGES.enterYourPhoneNumber.en + '<br>' + ERROR_MESSAGES.enterYourPhoneNumber.ar
        },

        initialize: function (options) {
            this.render();
        },

        events: {
            'submit #sendLogin'      : 'sendToken',
            'click #submitButton'    : 'sendToken',
            'input #login'           : 'checkLogin',
            'click #phoneNumberRadio': 'setPlaceholder',
            'click #emailRadio'      : 'setPlaceholder',
            'click #backToLogin'     : 'goToLogin'
        },

        goToLogin: function (e) {
            e.preventDefault();
            Backbone.history.navigate('#login', {trigger: true});
        },

        checkLogin: function (e) {
            var target = $(e.target);
            var value = target.val();
            var phoneRadio = this.$el.find('#phoneNumberRadio');
            var isPhone = phoneRadio.is(':checked');
            var regexp;
            var filteredValue;

            this.errors = {};

            // input field returns value with mask

            if (isPhone) {
                filteredValue = value.replace(/_/g, '');
            }

            if (!filteredValue || filteredValue.length < 15) {
                if (isPhone) {
                    this.errors.emptyPhoneInput = ERROR_MESSAGES.enterYourPhoneNumber.en + '<br>' + ERROR_MESSAGES.enterYourPhoneNumber.ar;
                } else {
                    this.errors.emptyEmailInput = ERROR_MESSAGES.enterYourEmail.en + '<br>' + ERROR_MESSAGES.enterYourEmail.ar;
                }

                return;
            }

            if (!isPhone) {
                regexp = CONSTANTS.EMAIL_REGEXP;
            } else {
                regexp = CONSTANTS.PHONE_REGEXP;
            }

            if (!regexp.test(filteredValue)) {
                if (isPhone) {
                    this.errors.incorrectPhoneValue = ERROR_MESSAGES.forgotPassword.incorrectPhoneNumber.en + '<br>' + ERROR_MESSAGES.forgotPassword.incorrectPhoneNumber.ar;
                } else {
                    this.errors.incorrectEmailValue = ERROR_MESSAGES.forgotPassword.incorrectEmailAddress.en + '<br>' + ERROR_MESSAGES.forgotPassword.incorrectEmailAddress.ar;
                }
            }
        },

        render: function () {
            var thisEl = this.$el;

            thisEl.html(this.template());
            this.setPlaceholder();

            this.$errrorHandler = $('#errorHandler');

            return this;
        },

        usernameFocus: function (event) {
            this.$el.find('.icon-login').toggleClass('active');
        },

        checkClick: function (event) {
            this.$el.find('.remember-me').toggleClass('active');
            if (this.$el.find('#urem').attr('checked')) {
                this.$el.find('#urem').removeAttr('checked');
            } else {
                this.$el.find('#urem').attr('checked', 'checked');
            }
        },

        sendToken: function (event) {
            var thisEl = this.$el;
            var form = thisEl.find('#sendLogin');
            var $login = form.find('#login');
            var ifPhone = thisEl.find('#phoneNumberRadio').is(':checked');
            var login = ifPhone ? _.escape($.trim($login.inputmask('unmaskedvalue'))) : _.escape($.trim($login.val()));
            var data = {
                login  : login,
                ifPhone: ifPhone
            };

            var errors = this.errors;
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

            if (data.login !== '') {
                form.removeClass('notRegister');
            }

            $.ajax({
                url : '/forgotPass',
                type: 'POST',
                data: data,

                success: function () {
                    if (ifPhone) {
                        window.location = '/verificateCode/' + login;
                    } else {
                        window.location = '/messageSent';
                    }
                },
                error  : function (err) {
                    form.addClass('notRegister');

                    App.render({type: 'error', message: ERROR_MESSAGES.invalidCredentials.en + '</br>' + ERROR_MESSAGES.invalidCredentials.ar});
                }
            });
        },

        setPlaceholder: function (e) {
            var $loginInput = this.$el.find('#login');

            $loginInput.val('');
            $loginInput.attr('data-inputmask-clearmaskonlostfocus', false);
            $loginInput.attr('data-masked', true);

            if (!e || e.target.id === 'phoneNumberRadio') {
                this.errors= {
                    emptyPhoneInput : ERROR_MESSAGES.enterYourPhoneNumber.en + '<br>' + ERROR_MESSAGES.enterYourPhoneNumber.ar
                };

                $loginInput.inputmask('+999(99)-999-9999');
                $loginInput.attr('placeholder', 'Enter phone number');
            } else {
                this.errors= {
                    emptyEmailInput : ERROR_MESSAGES.enterYourEmail.en + '<br>' + ERROR_MESSAGES.enterYourEmail.ar
                };

                $loginInput.inputmask({
                    mask  : '*{1,20}[.*{1,20}][.*{1,20}][.*{1,20}]@*{1,20}[.*{2,6}][.*{1,2}]',
                    greedy: false,
                    onBeforePaste: function (pastedValue, opts) {
                        pastedValue = pastedValue.toLowerCase();
                        return pastedValue.replace("mailto:", "");
                    },
                    definitions: {
                        '*': {
                            validator: "[0-9A-Za-z!#$%&'*+/=?^_`{|}~\-]",
                            cardinality: 1,
                            casing: "lower"
                        }
                    }
                });
                $loginInput.attr('placeholder', 'Enter email');
            }
        }
    });

    return LoginView;

});
