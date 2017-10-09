var _ = require('underscore');
var $ = require('jquery');
var template = require('../../../../templates/newProductLaunch/list/list.html');
var PreView = require('../../../views/newProductLaunch/preView/preView');
var paginator = require('../../../views/paginator');
var CONTENT_TYPES = require('../../../constants/contentType');
var BadgeStore = require('../../../services/badgeStore');
var App = require('../../../appState');

module.exports = paginator.extend({
    contentType: CONTENT_TYPES.NEWPRODUCTLAUNCH,
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

        BadgeStore.cleanupNewProductLaunch();

        this.makeRender(options);
    },

    listRowClick: function (e) {
        var that = this;
        var targetEl = $(e.target);
        var $targetRow = targetEl.closest('.listRow');
        var id = $targetRow.attr('data-id');
        var model = this.collection.get(id);

        e.stopPropagation();

        this.preView = new PreView({
            model      : model,
            translation: this.translation
        });
        this.preView.on('update-list-view', function () {
            that.collection.getPage(that.collection.currentPage, {
                filter: that.filter,
                reset: true,
            });
        });
    },

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var $holder = $currentEl.find('.reportingWrap');
        var jsonCollection = newModels.toJSON();
        var currentLanguage = App.currentUser.currentLanguage;
        var anotherLanguage = App.currentUser.currentLanguage === 'en' ? 'ar' : 'en';

        this.pageAnimation(this.collection.direction, $holder);

        $holder.empty();
        $holder.html(this.template({
            collection : jsonCollection,
            translation: this.translation,
            newLabelClass: App.currentUser.currentLanguage === 'en' ? 'class="newBrand"' : 'class="newBrandAr"',
            App: App,
            currentLanguage,
            anotherLanguage,
        }));
    },

    render: function () {
        var $currentEl = this.$el;
        var jsonCollection = this.collection.toJSON();
        var currentLanguage = App.currentUser.currentLanguage;
        var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

        $currentEl.html('');
        $currentEl.append('<div class="absoluteContent listnailsWrap"><div class="listnailsHolder scrollable"><div class="reportingWrap"></div></div></div>');

        var $holder = $currentEl.find('.reportingWrap');
        $holder.append(this.template({
            collection : jsonCollection,
            translation: this.translation,
            newLabelClass: App.currentUser.currentLanguage === 'en' ? 'class="newBrand"' : 'class="newBrandAr"',
            App: App,
            currentLanguage: currentLanguage,
            anotherLanguage: anotherLanguage,
        }));

        return this;
    }
});
