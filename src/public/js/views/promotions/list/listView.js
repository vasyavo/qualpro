var _ = require('underscore');
var $ = require('jquery');
var template = require('../../../../templates/promotions/list/list.html');
var newRow = require('../../../../templates/promotions/list/newRow.html');
var createView = require('../../../views/promotions/createView');
var EditPromotionView = require('../../../views/promotions/editView');
var PreView = require('../../../views/promotions/preView/preView');
var paginator = require('../../../views/paginator');
var CONTENT_TYPES = require('../../../constants/contentType');
var BadgeStore = require('../../../services/badgeStore');

module.exports = paginator.extend({
    contentType: CONTENT_TYPES.PROMOTIONS,
    viewType   : 'list',
    template   : _.template(template),
    templateNew: _.template(newRow),
    CreateView : createView,

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

        BadgeStore.cleanupPromoEvaluation();

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
        this.preView.on('showEditPromotionDialog', this.showEditPromotionDialog, this);
        this.preView.on('modelChanged', function (count) {
            self.changeCommentCount(count, $targetRow);
        });
    },

    changeCommentCount: function (count, $targetRow) {
        $targetRow.find('.userMassage').text(count);
    },

    showEditPromotionDialog: function (model, duplicate) {
        var self = this;

        this.editPromotionView = new EditPromotionView({
            model      : model,
            duplicate  : duplicate,
            translation: this.translation
        });

        this.editPromotionView.on('modelSaved', function (model) {
            self.collection.add(model, {merge: true});
            self.addReplaceRow(model);
        });
    },

    render: function () {
        var $currentEl = this.$el;
        var jsonCollection = this.collection.toJSON();
        var $holder;

        $currentEl.html('');
        $currentEl.append('<div class="absoluteContent listnailsWrap"><div class="listnailsHolder scrollable"><div class="listTable"></div></div></div>');

        $holder = $currentEl.find('.listTable');
        $holder.append(this.template({
            collection : jsonCollection,
            translation: this.translation
        }));

        return this;
    },

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var $holder = $currentEl.find('.listTable');
        var jsonCollection = newModels.toJSON();

        this.pageAnimation(this.collection.direction, $holder);

        $holder.empty();
        $holder.html(this.template({
            collection : jsonCollection,
            translation: this.translation
        }));
    }
});
