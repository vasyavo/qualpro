define([
    'backbone',
    'jQuery',
    'Underscore',
    'text!templates/menu/topMenu.html',
    'text!templates/menu/shortDescription.html',
    'views/personnel/preView/preView',
    'views/personnel/editView',
    'models/personnel',
    'js-cookie',
    'constants/errorMessages',
    'moment',
    'dataService',
    'constants/aclRoleIndexes'
], function (Backbone, $, _, template, shortDescriptionTemplate, personnelPreView,
             EditView, PersonnelModel, Cookies, ERROR_MESSAGES, moment, dataService, ACL_ROLE_INDEXES) {
    'use strict';

    var TopMenuView = Backbone.View.extend({
        tagName            : 'ul',
        el                 : '#topMenuHolder',
        template           : _.template(template),
        descriptionTemplate: _.template(shortDescriptionTemplate),

        events: {
            'click .personelShortDetail' : 'editPersonel',
            'click .currentLanguageInput': 'changeCurrentLanguage',
            'click .chat'                : 'goToNotes',
            'click .bell'                : 'goToNotifications',
            'click .logOut'              : 'logOut'
        },

        initialize: function (options) {
            this.render();

            this.on('changeStyle', this.changeStyle);

            _.bindAll(this, 'changeLanguageDebonce');
        },

        logOut: function () {
            var self = this;

            $.get('/logout', function () {
                App.socket.emit('logout');

                delete App.currentUser;

                self.changeStyle('en');

                Backbone.history.navigate('/login', {trigger: true});
            });
        },

        goToNotes: function (e) {
            Backbone.history.navigate('#qualPro/notes', {trigger: true});
        },

        goToNotifications: function (e) {
            var $notificationHolder = this.$el.find('#notificationCount');
            var self = this;
            var url = 'notifications/count';
            var data = {
                notificationCount: 0
            };
            dataService.putData(url, data, function (err, result) {
                if (err) {
                    App.render(err);
                }
                self.notificationsCount = result.notificationCount;
                App.currentUser.notificationCount = result.notificationCount;
                if (result.notificationCount === 0) {
                    $notificationHolder.text(0);
                    $notificationHolder.addClass('hidden');
                } else {
                    $notificationHolder.text(result.notificationCount);
                    $notificationHolder.removeClass('hidden');
                }
                Backbone.history.navigate('#qualPro/notifications', {trigger: true});
            });
        },

        editPersonel: function (e) {
            var self = this;
            var currentUser = new PersonnelModel(App.currentUser);
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
            var translationUrl = 'translations/' + currentLanguage + '/personnel';

            require([translationUrl], function (translation) {
                self.translation = translation;
                self.preView = new personnelPreView({
                    model      : currentUser,
                    fromTopMenu: true,
                    translation: translation
                });
                self.preView.on('openEditView', self.openEditView, self);
            });
        },

        openEditView: function (model) {
            var self = this;

            this.editView = new EditView({
                model      : model,
                translation: this.translation
            });

            this.editView.on('elementUpdated', function () {
                self.trigger('elementUpdated');
            });

            this.editView.on('modelSaved', function (model) {
                var user = model.toJSON();

                App.currentUser = user;

                self.renderCurrentUserInfo();
                self.preView.trigger('updatePreview', model);
            });
        },

        changeStyle: function (language) {
            var lang = language || App.currentUser.currentLanguage;
            var $scrollableElements = $('.scrollable.mCustomScrollbar, .scrollable-yx.mCustomScrollbar, .scrollable-xy.mCustomScrollbar')

            $('html').attr('dir', lang === 'ar' ? 'rtl' : 'ltr');
            $('#mainStyle').attr('href', 'css/main_' + lang + '.css');

            if ($scrollableElements.length) {
                $scrollableElements
                    .mCustomScrollbar('destroy')
                    .mCustomScrollbar();
            }
        },

        changeLanguageDebonce: _.debounce(function () {
            var self = this;
            var currentUser = new PersonnelModel(App.currentUser);
            var currentLanguage = currentUser.get('currentLanguage') || Cookies.get('currentLanguage');
            var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

            var translationUrl;

            if (this.currentCT) {
                translationUrl = 'translations/' + anotherLanguage + '/' + this.currentCT;
            }

            App.currentUser.currentLanguage = anotherLanguage;
            Cookies.set('currentLanguage', anotherLanguage);

            this.saveCurrentUser = function () {
                var self = this;

                currentUser.save('currentLanguage', anotherLanguage, {
                    validate: false,
                    patch   : true,
                    wait    : true,
                    success : function (currentUser) {
                        App.currentUser = currentUser.toJSON();
                        self.changeStyle(anotherLanguage);

                        $.datepicker.setDefaults($.datepicker.regional[App.currentUser.currentLanguage]);
                        moment.locale(App.currentUser.currentLanguage);
                        self.renderCurrentUserInfo();
                        self.trigger('languageChanged');
                    },
                    error   : function () {
                        App.render({
                            type   : 'error',
                            message: ERROR_MESSAGES.changedLanguageError.en + '</br>' + ERROR_MESSAGES.changedLanguageError.ar
                        });
                    }
                });
            };

            _.bindAll(this, 'saveCurrentUser');

            if (translationUrl) {
                require([translationUrl], function (translation) {
                    currentUser.setFieldsNames(translation);

                    self.saveCurrentUser();

                    self.trigger('translationLoaded', translation);
                });
            } else {
                this.saveCurrentUser();
            }
        }, 500),

        changeCurrentLanguage: function () {
            App.$preLoader.fadeFn({
                visibleState: true
            });
            this.changeLanguageDebonce();
        },

        renderCurrentUserInfo: function () {
            var currentUser = App.currentUser;
            var currentLanguage = currentUser.currentLanguage;
            var $curEl = this.$el;
            var $holder = $curEl.find('.personelShortDetail');
            var $notificationHolder = $curEl.find('#notificationCount');
            var state = (currentLanguage === 'ar');
            if (currentUser.notificationCount === 0) {
                $notificationHolder.text(0);
                $notificationHolder.addClass('hidden');
            } else {
                $notificationHolder.text(currentUser.notificationCount);
                $notificationHolder.removeClass('hidden');
            }
            $curEl.find('#currentLanguageInput').prop('checked', state);

            $holder.html(this.descriptionTemplate(currentUser));
        },

            render: function () {
            var userAccessLevel = App.currentUser.accessRole.level;
            var templateData = {
                showContactUsBadge : null
            };

            if (userAccessLevel === ACL_ROLE_INDEXES.MASTER_ADMIN || userAccessLevel === ACL_ROLE_INDEXES.COUNTRY_ADMIN || userAccessLevel === ACL_ROLE_INDEXES.MASTER_UPLOADER || userAccessLevel === ACL_ROLE_INDEXES.COUNTRY_UPLOADER) {
                templateData.showContactUsBadge = true;
            }

            this.$el.html(this.template(templateData));

            return this;
        }
    });

    return TopMenuView;
});
