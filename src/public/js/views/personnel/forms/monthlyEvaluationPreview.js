var $ = require('jquery');
var _ = require('underscore');
var template = require('../../../../templates/personnel/form/monthlyEvaluationPreviewTemplate.html');
var tableTemplate = require('../../../../templates/personnel/form/monthlyTableTemplate.html');
var BaseDialog = require('../../../views/baseDialog');
var EditView = require('../../../views/personnel/forms/monthlyEvaluationEdit');
var CONSTANTS = require('../../../constants/otherConstants');
var custom = require('../../../custom');
var App = require('../../../appState');
var requireContent = require('../../../helpers/requireContent');

module.exports = BaseDialog.extend({
    contentType  : 'monthly',
    template     : _.template(template),
    tableTemplate: _.template(tableTemplate),

    events: {
        'click #editBtn'    : 'onEditBtn',
        'click .monthlyItem': 'rowClick'
    },

    initialize: function (options) {
        this.translation = options.translation;
        this.model = options.model;
        this.personnel = options.personnel;

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
            var translation = requireContent(object.context + '.translation.' + App.currentUser.currentLanguage);
            var TargetModel = requireContent(object.context + '.model');
            var PreView = requireContent(object.context + '.views.preview');

            var itemModel = new TargetModel({_id: modelId});
            itemModel.on('sync', function (prettyModel) {
                self.preView = new PreView({
                    model      : prettyModel,
                    translation: translation
                });
            });
            itemModel.fetch();
        }
    },

    onEditBtn: function () {
        var $thisEl = this.$el;

        this.editView = new EditView({model: this.model, translation: this.translation});
        this.editView.on('monthlyEvaluationSave', function (model) {
            this.trigger('monthlyEvaluationSave', model);

            this.model = model;

            $thisEl.find('#target').html(model.get('target'));
            $thisEl.find('#achiev').html(model.get('achiev'));
            $thisEl.find('#age').html(model.get('age') + '%');
            $thisEl.find('#rating')
                .barrating('readonly', false)
                .barrating('set', model.get('rating'))
                .barrating('readonly', true);
        }, this);
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
            model               : this.model.toJSON(),
            translation         : this.translation,
            personnelAccessLevel: this.personnel.accessRole.level,
            App: App,
        })).dialog({
            dialogClass  : 'formDialog monthlyEvaluationForm monthlyEvaluationPreview',
            title        : this.translation.monthlyEvaluationPreview,
            showCancelBtn: false,
            buttons      : {
                ok: {
                    text : this.translation.okBtn,
                    click: function () {
                        $(this).dialog('close').dialog('destroy').remove();
                    }
                }
            }
        });

        $thisEl = this.$el;

        this.renderTasks();

        $thisEl.find('.rating').barrating({readonly: true});

        this.delegateEvents(this.events);
    }
});
