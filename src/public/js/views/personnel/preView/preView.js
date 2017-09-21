var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Cookies = require('js-cookie');
var async = require('async');
var template = require('../../../../templates/personnel/preview/preview.html');
var mainTemplate = require('../../../../templates/personnel/preview/main.html');
var changePassword = require('../../../../templates/personnel/changePassword.html');
var baseDialog = require('../../../views/baseDialog');
var personnelModel = require('../../../models/personnel');
var populate = require('../../../populate');
var common = require('../../../common');
var EvaluationView = require('../../../views/personnel/preView/evaluationView');
var TasksListView = require('../../../views/personnel/preView/tasksListView');
var CONSTANTS = require('../../../constants/otherConstants');
var REGEXP = require('../../../constants/validation');
var CONTENT_TYPES = require('../../../constants/contentType');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var App = require('../../../appState');

module.exports = baseDialog.extend({
    contentType : CONTENT_TYPES.PERSONNEL,
    imageSrc    : '',
    template    : _.template(template),
    mainTemplate: _.template(mainTemplate),

    events: {
        'click #editProfile'      : 'openEditView',
        'click #archiveBtn'       : 'disable', //   store in base dialog
        'click #unArchiveBtn'     : 'disable', //   store in base dialog
        'click .changePasswordBtn': 'changePassword',
        'click #findBtn'          : 'onFind',
        'click #goToBtn'          : 'goTo'
    },

    initialize: function (options) {
        var self = this;
        var modelId;

        this.model = options.model;
        this.activityList = options.activityList;
        this.translation = options.translation;
        this.fromTopMenu = options.fromTopMenu;
        this.hideButtons = options.hideButtons || false;

        modelId = options.id;

        async.waterfall([
            function (cb) {
                if (self.model) {
                    return cb(null);
                }

                self.model = new personnelModel({_id: modelId});
                self.model.fetch();

                self.model.on('sync', function () {
                    cb(null);
                });
            }
        ], function (err) {
            var jsonModel = self.model.toJSON();
            var accessLevel;
            self.canViewEvaluationTab = App.currentUser.accessRole.level < 5;

            if (!jsonModel.temp) {
                accessLevel = jsonModel.accessRole.level;
                self.isEvaluation = accessLevel > 2 && accessLevel < 8;


                if (self.isEvaluation && self.canViewEvaluationTab) {
                    self.evaluationView = {
                        monthly: new EvaluationView({
                            personnel  : jsonModel,
                            contentType: 'monthly',
                            constants  : {
                                listDd: CONSTANTS.RATING_MONTHLY_DD
                            },
                            translation: self.translation
                        }),

                        biYearly: new EvaluationView({
                            personnel  : jsonModel,
                            contentType: 'biYearly',
                            constants  : {
                                listDd  : CONSTANTS.RATING_BIYEARLY_DD,
                                rateList: CONSTANTS.RATING_BIYEARLY
                            },
                            translation: self.translation
                        })
                    };
                    self.tasksListView = new TasksListView({
                        id         : 'personnelTasks',
                        personnelId: self.model.get('_id'),
                        translation: self.translation
                    });
                }
            }

            self.responseObj = {};

            _.bindAll(self, 'changePass');

            self.makeRender();
            self.render();

            self.on('updatePreview', function (model) {
                var currentLanguage = model.get('currentLanguage') || Cookies.get('currentLanguage');
                var user = self.domainsToNames(model.toJSON(), currentLanguage);

                self.$el.find('#main').html(self.mainTemplate({
                    model       : user,
                    fromTopMenu : self.fromTopMenu,
                    translation : self.translation,
                    hideButtons : self.hideButtons,
                    activityList: self.activityList
                }));

                common.canvasDrawing({
                    model: user
                }, self);

                self.setCanvasSize();
            });
        });
    },

    onFind: function () {
        var id = this.model.get('_id');
        var filter = {
            _id: {
                values: [id],
                type  : 'ObjectId'
            }
        };

        this.trigger('saveModel');
        this.on('redirectForFind', function () {
            Backbone.history.navigate('#qualPro/personnel/all/list/filter=' + encodeURIComponent(JSON.stringify(filter)), {trigger: true});
        });
    },

    changePassword: function (e) {
        var self = this;
        var changePassTempl = _.template(changePassword);

        $(changePassTempl({translation: self.translation})).dialog({
            modal        : true,
            closeOnEscape: false,
            autoOpen     : true,
            dialogClass  : 'changePass-dialog',
            width        : '310',
            // height       : "467",
            resizable    : true,
            title        : 'Change Password',
            buttons      : {
                save  : {
                    text : 'Save',
                    class: 'btn',
                    click: self.changePass
                },
                cancel: {
                    text : 'Cancel',
                    class: 'btn',
                    click: function () {
                        self.hideChangePassDialog();
                    }
                }
            }
        });
    },

    hideChangePassDialog: function () {
        $('.changePass-dialog').remove();
    },

    changePass: function (e) {
        var self = this;
        var Model = this.model;
        var oldPass = $.trim($('#oldPassword').val());
        var newPass = $.trim($('#newPassword').val());
        var confirmPass = $.trim($('#confirmNewPassword').val());
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
        var canProcess = newPass === confirmPass;

        if (!canProcess) {
            return App.render({type: 'error', message: ERROR_MESSAGES.passMismatch[currentLanguage]});
        }

        if (oldPass.length < 3 || newPass.length < 3) {
            return App.render({type: 'error', message: ERROR_MESSAGES.passLengthErr[currentLanguage]});
        }

        Model.save({
            oldPass: oldPass,
            newPass: newPass
        }, {
            wait    : true,
            patch   : true,
            validate: false,

            success: function (model, response) {
                App.render({type: 'notification', message: ERROR_MESSAGES.passChangeSuccess[currentLanguage]});

                self.hideChangePassDialog();
            },

            error: function (model, xhr) {
                if (xhr.status === 432) {
                    return App.render({type: 'error', message: ERROR_MESSAGES.wrongPassword[currentLanguage]});
                }

                App.render({type: 'error', message: xhr.responseText});
            }
        });
    },

    openEditView: function (e) {
        this.trigger('openEditView', this.model);
    },

    disable: function (e) {
        var archived = this.model.get('archived');

        e.showPopUp = false;
        e.notPushChecked = true;
        this.model.set('archived', !archived);

        if (archived) {
            this.$el.find('#archiveBtn').show();
            this.$el.find('#unArchiveBtn').hide();
        } else {
            this.$el.find('#archiveBtn').hide();
            this.$el.find('#unArchiveBtn').show();
        }

        this.trigger('disableEvent', e, [this.model.get('_id')]);
    },

    render: function () {
        var user = this.domainsToNames(this.model.toJSON(), App.currentUser.currentLanguage);
        var formString;
        var phone = user.phoneNumber;
        var $formString;
        var self = this;

        if (phone) {
            user.phoneNumber = phone.replace(REGEXP.DISPLAY_PHONE_REGEXP, '+$1($2)-$3-$4');
        }

        formString = this.template({
            model            : user,
            translation      : this.translation,
            isEvaluation     : this.isEvaluation,
            canViewEvaluation: this.canViewEvaluationTab,
            activityList     : this.activityList,
            App: App,
        });
        $formString = $(formString);
        $formString.find('#main').html(this.mainTemplate({
            model       : user,
            fromTopMenu : this.fromTopMenu,
            translation : this.translation,
            hideButtons : this.hideButtons,
            activityList: this.activityList,
            App: App,
        }));

        if (this.isEvaluation && this.canViewEvaluationTab) {
            $formString.find('#monthly').html(this.evaluationView.monthly.el);
            $formString.find('#biYearly').html(this.evaluationView.biYearly.el);
            $formString.find('.personnelTasks').append(this.tasksListView.el);
            this.on('$tabsChanged', function (id) {
                self.tasksListView.trigger('getNewData', id);
            });
        }

        this.$el = $formString.dialog({
            dialogClass  : 'previewDialog user-profile-dialog',
            title        : 'Preview Personnel',
            showCancelBtn: false,
            buttons      : {
                save: {
                    text : this.translation.okBtn,
                    click: function () {
                        $(this).dialog('destroy').remove();

                        if (self.isEvaluation && self.canViewEvaluationTab) {
                            self.tasksListView.filterView.removeAll();
                            self.tasksListView.undelegateEvents();
                            self.tasksListView.remove();
                        }
                        delete App.filterCollections.personnelTasks;

                        self.undelegateEvents();
                    }
                }
            }
        });

        common.canvasDraw({
            model: user
        }, this);

        this.delegateEvents(this.events);

        // this.$errrorHandler = $('#errorHandler');
        return this;
    }
});
