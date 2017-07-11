var _ = require('underscore');
var $ = require('jQuery');
var template = require('text!templates/competitorBranding/list/list.html');
var PreView = require('views/competitorBranding/preView/preView');
var paginator = require('views/paginator');
var CONTENT_TYPES = require('constants/contentType');
var BadgeStore = require('services/badgeStore');

module.exports = paginator.extend({
    contentType: CONTENT_TYPES.COMPETITORBRANDING,
    viewType   : 'list',
    template   : _.template(template),

    events: {
        'click .listRow': 'incClicks'
    },

    initialize: function (options) {
        this.translation = options.translation;
        this.filter = options.filter;
        this.tabName = options.tabName;
        this.collection = options.collection;
        this.defaultItemsNumber = this.collection.pageSize;
        this.listLength = this.collection.totalRecords;

        options.contentType = this.contentType;

        BadgeStore.cleanupCompetitorBrandingAndDisplay();

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
                reset: true,
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
