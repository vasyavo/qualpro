var _ = require('underscore');
var thumbnailsTemplate = require('../../../templates/domain/thumbnails.html');
var thumbnails = require('../../views/thumbnails');
var contentTypes = require('../../helpers/contentTypesHelper');
var EditView = require('../../views/domain/editView');
var CreateView = require('../../views/domain/createView');
var newThumbnail = require('../../../templates/domain/newThumbnail.html');
var createLogicForDomainView = require('../../helpers/createLogicForDomainView');
var CONTENT_TYPES = require('../../constants/contentType');
var BadgeStore = require('../../services/badgeStore');
var App = require('../../appState');

var types = [
    CONTENT_TYPES.COUNTRY,
    CONTENT_TYPES.REGION,
    CONTENT_TYPES.SUBREGION,
    CONTENT_TYPES.RETAILSEGMENT,
    CONTENT_TYPES.OUTLET,
    CONTENT_TYPES.BRANCH
];

var View = thumbnails.extend({
    el         : '#contentHolder',
    viewType   : 'thumbnails',
    template   : _.template(thumbnailsTemplate),
    CreateView : CreateView,
    EditView   : EditView,
    templateNew: _.template(newThumbnail),

    view       : null,
    breadcrumbs: null,
    contentType: null,
    parentId   : null,

    events: {
        "click .checkboxLabel"             : "checked", //method locate in paginator
        "click input[type='checkbox']"     : "inputClick",//just for prevent thumbnailsClick
        "click .thumbnail:not(label,input)": "thumbnailsClick",
    },

    initialize: function (options) {
        this.filter = options.filter;
        this.logic = createLogicForDomainView(this);
        this.logic.initializeView(options);

        this.tabName = options.tabName || 'all';
        this.contentType = options.contentType;

        BadgeStore.cleanupCountries();

        this.makeRender(options);
    },

    render: function () {
        var $currentEl = this.$el;
        var $holder;
        var jsonCollection = this.collection.toJSON();

        $currentEl.html('');
        $currentEl.append('<div class="thumbnailsHolder scrollable"><div class="thumbnailsItems"></div></div>');

        jsonCollection.contentType = this.contentType;

        var show = this.checkShowAccess();

        $holder = $currentEl.find('.thumbnailsItems');
        $holder.append(this.template({
            collection  : jsonCollection,
            childContent: this.childContent,
            tabName     : this.tabName,
            show        : show,
            contentType : this.contentType
        }));

        if (!this.breadcrumbs) {
            this.logic.createBreadcrumbs();
        }

        return this;
    },

    createItem: function () {
        this.logic.createNewItem(this.translation);
    },

    childContentLoader: function (childContentType, parentId, parentName, parentTabName) {
        if (parentTabName === true) {
            parentTabName = 'archived';
        } else if (parentTabName === false) {
            parentTabName = 'all';
        }

        this.logic.loadChildContent(childContentType, parentId, parentName, parentTabName);
    },

    thumbnailsClick: _.debounce(function (e) {
        var $targetEl = $(e.target);

        var $targetDivContainer = $targetEl.closest('.thumbnail.' + this.contentType);

        var id = $targetDivContainer.attr('data-id');
        var name = $targetDivContainer.find('span').text();

        if (this.childContent) {
            this.childContentLoader(this.childContent, id, name, this.tabName);
            this.trigger('hideActionDd');
        } else {
            this.previewItem(id);
        }
    }, 1000, true),

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var $holder = $currentEl.find('.thumbnailsItems');
        var jsonCollection = newModels.toJSON();
        var show;

        this.pageAnimation(this.collection.direction, $holder);

        this.trigger('hideActionDd');
        this.trigger('unCheckSelectAll');

        jsonCollection.contentType = this.contentType;

        show = this.checkShowAccess();

        $holder.empty();
        $holder.html(this.template({
            collection : jsonCollection,
            tabName    : this.tabName,
            show       : show,
            contentType: this.contentType
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

contentTypes.setContentTypes(types);

module.exports = View;
