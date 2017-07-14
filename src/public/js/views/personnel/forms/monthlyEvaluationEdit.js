var $ = require('jQuery');
var _ = require('underscore');
var template = require('../../../../templates/personnel/form/monthlyEvaluationEditTemplate.html');
var tableTemplate = require('../../../../templates/personnel/form/monthlyTableTemplate.html');
var BaseDialog = require('../../../views/baseDialog');
var CONSTANTS = require('../../../constants/otherConstants');
var custom = require('../../../custom');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var validation = require('../../../validation');
var App = require('../../../appState');

module.exports = BaseDialog.extend({
    contentType  : 'monthly',
    template     : _.template(template),
    tableTemplate: _.template(tableTemplate),

    events: {
        'input #target'     : 'inputAchievement',
        'input #achiev'     : 'inputAchievement',
        'click .monthlyItem': 'rowClick'
    },

    initialize: function (options) {
        this.translation = options.translation;
        this.model = options.model;

        this.target = this.model.get('target');
        this.achiev = this.model.get('achiev');

        this.makeRender();
        this.render();
    },

    rowClick: function (e) {
        var self = this;
        var key = e.currentTarget.id.slice(0, -5);
        var $tr = $(e.target).closest('tr');
        var modelId = $tr.attr('data-id');
        var collection = this.model.toJSON();
        var object = _.findWhere(collection[key], {_id: modelId});

        var context = $(e.currentTarget).attr('data-content');

        var missingPreviews = ['branch', 'competitorsList', 'country', 'itemsPrices', 'outlet', 'region', 'retailSegment', 'subRegion'];
        var translationUrl;
        var targetModelUrl;
        var preViewUrl;

        if (object) {
            if (!object.type) {
                object.context = context;
            } else {
                object.context = object.type;
            }
        }

        e.stopPropagation();

        if (object && (missingPreviews.indexOf(object.context) === -1)) {
            translationUrl = 'translations/' + App.currentUser.currentLanguage + '/' + object.context;
            targetModelUrl = 'models/' + object.context;
            preViewUrl = 'views/' + object.context + '/preView/preView';

            require([translationUrl, targetModelUrl, preViewUrl], function (translation, TargetModel, PreView) {
                var itemModel = new TargetModel({_id: modelId});
                itemModel.on('sync', function (prettyModel) {
                    self.preView = new PreView({
                        model      : prettyModel,
                        translation: translation
                    });
                });
                itemModel.fetch();
            });
        }
    },

    inputAchievement: function (e) {
        var $target = $(e.target);
        var targetId = $target.attr('id');
        var val = parseInt($target.val());

        if (!isNaN(val) && isFinite(val)) {
            $target.val(val);
            this[targetId] = val;
        } else {
            $target.val('');
            delete this[targetId];
        }

        this.calcAge();
    },

    calcAge: function () {
        var $age = this.$el.find('#age');
        var age;

        if (this.target && this.achiev) {
            age = Math.round(this.achiev / this.target * 100);
            $age.text(age + '%');
        } else {
            $age.text('');
        }
    },

    showPopUp: function (callback) {
        App.showPopUp({
            contentType: this.contentType,
            action     : 'save',
            saveTitle  : 'Save',
            saveCb     : callback
        });
    },

    saveMonthlyEvaluation: function () {
        var self = this;
        var $thisEl = this.$el;
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || 'en';
        var saveData = {
            target: this.target,
            achiev: this.achiev,
            rating: +$thisEl.find('#rating').siblings('.br-widget').find('.br-current').attr('data-rating-value')
        };
        var errors = [];

        validation.checkForValuePresence(errors, true, saveData.target, this.translation.target);
        validation.checkForValuePresence(errors, true, saveData.achiev, this.translation.achiev);
        validation.checkForValuePresence(errors, true, saveData.rating, this.translation.rating);

        if (errors.length > 0) {
            return App.renderErrors(errors);
        }

        this.showPopUp(function () {
            var that = this;

            self.model.save(saveData, {
                patch  : true,
                success: function (model) {
                    self.trigger('monthlyEvaluationSave', model);
                    $(that).dialog('destroy').remove();
                    $thisEl.dialog('destroy').remove();
                },

                error: function () {
                    App.render({
                        type   : 'error',
                        message: ERROR_MESSAGES.canNotSaveMonthlyEvalOnServer[currentLanguage]
                    });
                }
            });
        });
    },

    parseTasks: function (tasks) {
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || 'en';
        var anotherLanguage = (currentLanguage === 'en') ? 'ar' : 'en';
        var statuses = CONSTANTS.OBJECTIVES_UI_STATUSES;
        var reportsTypes = CONSTANTS.RATING_MONTHLY_REPORTS_TYPES;

        tasks.forEach(function (task) {
            var title = task.title;
            var type;
            var status;

            if (title) {
                title.currentLanguage = title[currentLanguage] || title[anotherLanguage];
            }

            if (task.type) {
                type = _.findWhere(reportsTypes, {_id: task.type});
                task.typeText = type.name[currentLanguage];
            }

            if (task.status) {
                status = _.findWhere(statuses, {_id: task.status});
                task.statusText = status.name;
            }

            if (task.date) {
                task.dateText = custom.dateFormater('DD.MM.YYYY', task.date);
            }
        });
    },

    renderTasks: function () {
        var self = this;
        var $thisEl = this.$el;
        var jsonModel = this.model.toJSON();

        var keys = ['individualObjectives', 'companyObjectives', 'inStoreTasks', 'submittingReports'];

        keys.forEach(function (key) {
            self.parseTasks(jsonModel[key]);

            $thisEl.find('#' + key + 'Table').html(self.tableTemplate({
                tasks      : jsonModel[key],
                translation: self.translation
            }));
        });

        $thisEl.find('.scrollable').mCustomScrollbar();
    },

    render: function () {
        var self = this;
        var $thisEl;

        this.$el = $(this.template({
            model      : this.model.toJSON(),
            translation: this.translation
        })).dialog({
            dialogClass: 'formDialog monthlyEvaluationForm monthlyEvaluationEdit',
            title      : this.translation.monthlyEvaluationEdit,
            buttons    : {
                submit: {
                    text : this.translation.submitBtn,
                    class: 'btn floatRight',
                    click: function () {
                        self.saveMonthlyEvaluation();
                    }
                },

                cancel: {
                    text: this.translation.cancelBtn
                }
            }
        });

        $thisEl = this.$el;

        this.renderTasks();

        $thisEl.find('.rating').barrating();

        this.delegateEvents(this.events);
    }
});
