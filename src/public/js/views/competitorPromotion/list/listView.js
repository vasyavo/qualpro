var _ = require('underscore');
var $ = require('jQuery');
var template = require('../../../../templates/competitorPromotion/list/list.html');
var PreView = require('../../../views/competitorPromotion/preView/preView');
var paginator = require('../../../views/paginator');
var BadgeStore = require('../../../services/badgeStore');

module.exports = paginator.extend({
    contentType: 'competitorPromotion',
    viewType   : 'list',
    template   : _.template(template),

    events: {
        'click .listRow': 'incClicks'
    },

    initialize: function (options) {
        this.filter = options.filter;
        this.tabName = options.tabName;
        this.collection = options.collection;
        this.defaultItemsNumber = this.collection.pageSize;
        this.listLength = this.collection.totalRecords;

        options.contentType = this.contentType;

        BadgeStore.cleanupCompetitorPromoActivities();

        this.makeRender(options);
    },

    listRowClick: function (e) {
        var targetEl = $(e.target);
        var $targetRow = targetEl.closest('.listRow');
        var id = $targetRow.attr('data-id');
        var model = this.collection.get(id);
        var self = this;

        e.stopPropagation();

        this.preView = new PreView({
            model      : model,
            translation: this.translation
        });
        this.preView.on('modelChanged', function (count) {
            self.changeCommentCount(count, $targetRow);
        });
        this.preView.on('update-list-view', function () {
            self.collection.getPage(self.collection.currentPage, {
                filter: self.filter,
            });
        });
    },

    changeCommentCount: function (count, $targetRow) {
        $targetRow.find('.userMassage').text(count);
    },

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var $holder = $currentEl.find('.reportingWrap');
        var jsonCollection = newModels.toJSON();

        this.pageAnimation(this.collection.direction, $holder);

        $holder.empty();
        $holder.html(this.template({
            collection : jsonCollection,
            translation: this.translation
        }));
    },

    render: function () {
        var $currentEl = this.$el;
        var jsonCollection = this.collection.toJSON();
        var $holder;

        jsonCollection.map(function (model) {
            model.displayTypeString = model.displayType.map((item) => {
                return item.name.currentLanguage;
            }).join(', ');

            return model;
        });

        $currentEl.html('');
        $currentEl.append('<div class="absoluteContent listnailsWrap"><div class="listnailsHolder scrollable"><div class="reportingWrap"></div></div></div>');

        $holder = $currentEl.find('.reportingWrap');
        $holder.append(this.template({
            collection : jsonCollection,
            translation: this.translation
        }));

        return this;
    }
});
