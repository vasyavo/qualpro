var _ = require('underscore');
var $ = require('jquery');
var paginator = require('../../../views/paginator');
var CreateView = require('../../../views/questionnary/createView');
var PreView = require('../../../views/questionnary/preView/preView');
var template = require('../../../../templates/questionnary/list/list.html');
var NewRowTemplate = require('../../../../templates/questionnary/list/newRow.html');
var CONTENT_TYPES = require('../../../constants/contentType');
var BadgeStore = require('../../../services/badgeStore');
var App = require('../../../appState');

module.exports = paginator.extend({
    contentType: CONTENT_TYPES.QUESTIONNARIES,
    viewType   : 'list',
    CreateView : CreateView,

    template   : _.template(template),
    templateNew: _.template(NewRowTemplate),

    events: {
        'click .flexRow': 'incClicks'
    },

    initialize: function (options) {
        this.translation = options.translation;
        this.filter = options.filter;
        this.tabName = options.tabName;
        this.collection = options.collection;
        this.defaultItemsNumber = this.collection.pageSize;
        this.listLength = this.collection.totalRecords;

        options.contentType = this.contentType;

        BadgeStore.cleanupQuestionnaire();

        this.makeRender(options);
    },

    listRowClick: function (e) {
        var self = this;
        var $targetEl = $(e.target);
        var $targetRow = $targetEl.closest('.flexRow');
        var id = $targetRow.attr('data-id');
        var model = this.collection.get(id);

        this.preView = new PreView({
            model      : model,
            translation: this.translation
        });
        this.preView.on('duplicate', this.createItem, this);
        this.preView.on('edit', this.createItem, this);
        this.preView.on('updatePreview', function (model) {
            self.collection.add(model, {merge: true});
        });
        this.preView.on('re-render', function (questionId) {
            var questionBlock = $('#question-block-' + questionId);
            questionBlock.click();
            questionBlock.click();
        });
        this.preView.on('update-list-view', function () {
            self.collection.getPage(self.collection.currentPage, {
                filter: self.filter,
            });
        });
    },

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var jsonCollection = newModels.toJSON();

        this.pageAnimation(this.collection.direction, $currentEl);

        $currentEl.empty();
        $currentEl.html(this.template({
            collection : jsonCollection,
            translation: this.translation,
            App: App,
        }));
    },

    render: function () {
        var $currentEl = this.$el;
        var jsonCollection = this.collection.toJSON();

        $currentEl.html(this.template({
            collection : jsonCollection,
            translation: this.translation,
            App: App,
        }));

        return this;
    }

});
