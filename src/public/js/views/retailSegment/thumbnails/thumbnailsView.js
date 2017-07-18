var _ = require('underscore');
var $ = require('jquery');
var thumbnailsTemplate = require('../../../../templates/retailSegment/thumbnails/thumbnailsView.html');
var thumbnails = require('../../../views/thumbnails');
var createView = require('../../../views/domain/createView');
var EditView = require('../../../views/domain/editView');
var PreView = require('../../../views/domain/preView/preView');
var newThumbnail = require('../../../../templates/domain/newThumbnail.html');
var BadgeStore = require('../../../services/badgeStore');
var App = require('../../../appState');

module.exports = thumbnails.extend({
    el         : '#contentHolder',
    viewType   : 'thumbnails',
    template   : _.template(thumbnailsTemplate),
    templateNew: _.template(newThumbnail),

    CreateView: createView,
    EditView  : EditView,

    view        : null,
    breadcrumbs : null,
    contentType : 'retailSegment',
    $mainContent: null,
    parentId    : null,

    events: {
        'click .checkboxLabel'             : 'checked',
        'click input[type="checkbox"]'     : 'inputClick',
        'click .thumbnail:not(label,input)': 'incClicks'
    },

    initialize: function (options) {
        this.filter = options.filter;
        this.ContentCollection = options.ContentCollection;
        this.collection = options.collection;
        this.defaultItemsNumber = this.collection.pageSize;
        this.listLength = this.collection.totalRecords;
        this.page = options.collection.page;

        BadgeStore.cleanupTradeChannel();

        this.makeRender(options);
    },

    render: function () {
        var $currentEl = this.$el;
        var self = this;
        var $holder;

        var show = this.checkShowAccess();

        $currentEl.html('');

        $currentEl.append('<div class="thumbnailsHolder scrollable"><div class="thumbnailsItems"></div></div>');

        $holder = $currentEl.find('.thumbnailsItems');

        $holder.append(this.template({
            collection: self.collection.toJSON(),
            tabName   : this.tabName,
            show      : show
        }));

        return this;
    },

    showPreview: function (e) {
        var targetEl = $(e.target);
        var targetDivContainer = targetEl.closest('.thumbnail.retailSegment');
        var id = targetDivContainer.attr('data-id');

        var model = this.collection.get(id);

        new PreView({contentType: this.contentType, model: model, translation: this.translation});
    },

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var $holder = $currentEl.find('.thumbnailsItems');
        var jsonCollection = newModels.toJSON();
        var show = this.checkShowAccess();

        this.pageAnimation(this.collection.direction, $holder);

        this.trigger('hideActionDd');
        this.trigger('unCheckSelectAll');

        jsonCollection.contentType = this.contentType;

        $holder.empty();
        $holder.html(this.template({
            collection: jsonCollection,
            tabName   : this.tabName,
            show      : show
        }));

        $holder.find('#checkAll').prop('checked', false);
    },

    checkShowAccess: function () {
        var accessLevel = App.currentUser.accessRole.level;
        var contentType = this.contentType;

        var checkBoxesObject = {
            2: ['country'],
            9: ['country'],
            3: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'],
            4: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
        };

        if (checkBoxesObject.hasOwnProperty(accessLevel) && checkBoxesObject[accessLevel].indexOf(contentType) !== -1) {
            return false;
        }
        return true;
    }
});
