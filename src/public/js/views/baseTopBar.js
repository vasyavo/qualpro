var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var CONSTANTS = require('../constants/otherConstants');
var App = require('../appState');

var TopBarView = Backbone.View.extend({
    el    : '#topBarHolder',
    events: {
        'click .itemsNumber'                       : 'switchPageCounter',
        'change #currentShowPage'                  : 'showPage',
        'click .showPage'                          : 'showPage',
        'click #firstShowPage'                     : 'firstPage',
        'click #previousPage'                      : 'previousPage',
        'click #nextPage'                          : 'nextPage',
        'click #lastShowPage'                      : 'lastPage',
        'click #createBtn'                         : 'createEvent',
        'click #editBtn'                           : 'editEvent',
        'click #archiveBtn'                        : 'disableEvent',
        'click #unArchiveBtn'                      : 'disableEvent',
        'click .changeContentView:not(.filterType)': 'changeViewType',
        'click .changeContentView.filterType'      : 'changeByFilterType',
        'click #actionHolder:not(ul)'              : 'showHideActionDropdown',
        'click .allPage, .currentPageList'         : 'showPagesPopup',
        'mouseover .hasSubMenu'                    : 'showSubMenu',
        'mouseleave .hasSubMenu'                   : 'hideSubMenu',
        'click .filterHeader'                      : 'toggleFilterHolder',
        'click #checkAll'                          : 'checkAll'
    },

    toggleFilterHolder: function (e) {
        var $target = $(e.target);
        var $filterBar = $target.closest('.filterBar');
        var $filterBarName = $filterBar.find('.filterHeader');

        if ($target.closest('.searchInputWrap').length) {
            return false;
        }

        $filterBarName.toggleClass('downArrow');
        $filterBarName.toggleClass('upArrow');

        $filterBar.toggleClass('filterBarCollapse');
        this.$el.find('.scrollable').mCustomScrollbar('update');
    },

    initialize: function (options) {
        this.contentType = options.contentType || this.contentType;
        this.viewType = options.viewType;
        this.tabName = options.tabName;
        this.translation = options.translation;
        this.sendPassForCurrentUser = !options.sendPass;

        this.render();
    },

    preventDefaults: function (e) {
        e.preventDefault();
        e.stopPropagation();
    },

    hideCheckAll: function () {
        this.$el.find('.checkboxArea').addClass('hidden');
    },

    showCheckAll: function () {
        this.$el.find('.checkboxArea').removeClass('hidden');
    },

    switchPageCounter: function (e) {
        var $ul = $(e.target).closest('ul');
        this.preventDefaults(e);

        $ul.toggle();

        this.trigger('switchPageCounter', e);
    },

    setPagination: function (options) {
        var $curEl = this.$el;
        var $pageList = $curEl.find('#pageList');
        var $curPageInput = $curEl.find('#currentShowPage');
        var $itemsNumber = $curEl.find('#itemsNumber');

        var currentPage = parseInt(options.currentPage, 10) || parseInt($curPageInput.val(), 10);
        var itemsNumber = parseInt(options.itemsNumber, 10) || parseInt($itemsNumber.text(), 10);

        var $gridStart = this.$el.find('#gridStart');
        var $gridEnd = this.$el.find('#gridEnd');
        var $gridCount = this.$el.find('#gridCount');

        var gridCount;
        var gridStartValue;
        var gridEndValue;
        var pageNumber;
        var $lastPage;
        var i;

        currentPage = isNaN(currentPage) ? 1 : currentPage;

        if (isNaN(itemsNumber)) {
            itemsNumber = CONSTANTS.DEFAULT_PER_PAGE;
        }

        gridCount = (options.length >= 0) ? options.length : parseInt($gridCount.text(), 10);
        gridStartValue = (currentPage - 1) * itemsNumber;
        gridEndValue = gridStartValue + itemsNumber;

        $gridCount.text(gridCount);

        if (gridCount === 0) {
            this.hideCheckAll();
        } else {
            this.showCheckAll();
        }

        if (gridEndValue > gridCount) {
            gridEndValue = gridCount;
        }

        $gridStart.text((gridCount === 0) ? 0 : gridStartValue + 1);
        $gridEnd.text(gridEndValue);

        if (options.length || options.length === 0) {
            $lastPage = $curEl.find('#lastPage');
            pageNumber = Math.ceil(gridCount / itemsNumber);
            $pageList.html('');

            pageNumber = pageNumber || 1;

            for (i = 1; i <= pageNumber; i++) {
                $pageList.append('<li class="showPage">' + i + '</li>');
            }

            $lastPage.text(pageNumber);

            if (pageNumber <= 1) {
                $curEl.find('#nextPage').prop('disabled', true);
                $curEl.find('#previousPage').prop('disabled', true);
            } else {
                $curEl.find('#previousPage').prop('disabled', gridStartValue + 1 === 1);
                $curEl.find('#nextPage').prop('disabled', gridEndValue === gridCount);
            }
        }

        $curEl.find('#pageListScrollable').mCustomScrollbar();

        if (options.itemsNumber) {
            $itemsNumber.text(itemsNumber);
        }

        $curPageInput.val(currentPage);
    },

    showFilteredPage: function () {
        var $curEl = this.$el;
        var $itemsNumber = $curEl.find('#itemsNumber');
        var itemsNumber = $itemsNumber.text();

        if (this.viewType === 'thumbnails') {
            $curEl.find('#checkAll').prop('checked', false);
        }

        this.setPagination({currentPage: 1, itemsNumber: itemsNumber});

        this.trigger('getPage', {count: itemsNumber, page: 1});

    },

    showPage: function (e) {
        var $curEl = this.$el;
        var $target = $(e.target);
        var $ulContent = $target.closest('.pagesPopup');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = $target.text() || $target.val();
        var itemsNumber = $itemsNumber.text();

        this.preventDefaults(e);

        this.setPagination({currentPage: currentPage, itemsNumber: itemsNumber});

        this.trigger('getPage', {count: itemsNumber, page: currentPage});
        $ulContent.toggle();
    },

    firstPage: function (e) {
        this.preventDefaults(e);

        this.trigger('firstPage');
    },

    previousPage: function (e) {
        var $curEl = this.$el;
        var $curPageInput = $curEl.find('#currentShowPage');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = parseInt($curPageInput.val(), 10) - 1;
        var itemsNumber = parseInt($itemsNumber.text(), 10);

        this.preventDefaults(e);

        this.trigger('previousPage', {page: currentPage, itemsNumber: itemsNumber});
    },

    lastPage: function (e) {
        this.preventDefaults(e);

        this.trigger('lastPage');
    },

    nextPage: function (e) {
        var $curEl = this.$el;
        var $lastPage = $curEl.find('#lastPage');
        var $curPageInput = $curEl.find('#currentShowPage');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = parseInt($curPageInput.val(), 10) + 1;
        var itemsNumber = parseInt($itemsNumber.text(), 10);
        var lastPage = parseInt($lastPage.text(), 10);

        if (currentPage > lastPage) {
            currentPage = lastPage;
        }

        this.preventDefaults(e);

        this.trigger('nextPage', {page: currentPage, itemsNumber: itemsNumber});
    },

    createEvent: _.debounce(function (e) {
        this.preventDefaults(e);

        this.trigger('createEvent');
    }, 1000, true),

    editEvent: function (e) {
        this.preventDefaults(e);

        this.trigger('editEvent');
    },

    disableEvent: function (e) {
        this.preventDefaults(e);

        this.trigger('disableEvent', e);
    },

    changeViewType: function (e) {
        var targetEl = $(e.target);
        var url;
        var viewType;
        var link;

        this.preventDefaults(e);

        link = targetEl.closest('a');
        viewType = link.attr('data-view-type');
        url = this.replaceViewTypeInCurrentUrl(this.viewType, viewType);

        Backbone.history.navigate(url, {trigger: true});

    },

    replaceViewTypeInCurrentUrl: function (currentType, newType) {
        return Backbone.history.fragment.replace(new RegExp(currentType), newType);
    },

    showPagesPopup: function (e) {
        var target = $(e.target);
        var curUl = target.closest('button').next('.pagesPopup');

        curUl.toggle();

        return false;
    },

    changeTabs: function (value) {
        var $curEl = this.$el;
        var $container = $curEl.find('#templateSwitcher');
        var $actionBar = $curEl.find('#actionHolder');
        var filterTab = value === 'archived';
        var $targetAction = $actionBar.find('[data-archived-type="' + filterTab + '"]');
        var $targetTab = $container.find('#' + value);
        var $createBtn = $curEl.find('#createBtn');
        var $editBtn = $curEl.find('#editBtn');

        var $checkboxes = $curEl.find('input[type="checkbox"]');

        this.tabName = value;

        $checkboxes.prop('checked', false);

        $targetTab.addClass('viewBarTabActive');
        $targetTab.siblings().removeClass('viewBarTabActive');

        $targetAction.show('viewBarTabActive');
        $targetAction.siblings('.archiveBtn').hide('viewBarTabActive');

        if (filterTab === false) {
            $createBtn.show();
            $editBtn.show();
        } else {
            $createBtn.hide();
            $editBtn.hide();
        }

        this.hideAction();

        this.trigger('showFilteredContent', value);
    },

    hideCreateForBreadCrumbs: function (value) {
        var $curEl = this.$el;
        var $createBtn = $curEl.find('#createBtn');

        if (value === true) {
            $createBtn.hide();
        }
    },

    collapseActionDropDown: function () {
        var $curEl = this.$el;
        var $actionBar = $curEl.find('#actionHolder');

        $actionBar.find('ul').removeClass('showActionDropDown');
        return $actionBar;
    },

    hideAction: function () {
        this.collapseActionDropDown().addClass('hidden');
    },

    unCheckSelectAll: function () {
        var $curEl = this.$el;
        var $selectAll = $curEl.find('#checkAll');

        $selectAll.prop('checked', false);
    },

    changeByFilterType: function (e) {
        var $targetEl = $(e.target);
        var value = $targetEl.attr('id');

        this.preventDefaults(e);

        if (!$targetEl.hasClass('viewBarTabActive')) {
            this.changeTabs(value);
        }
    },

    showHideActionDropdown: function (e) {
        var targetEl = $(e.target);
        var parentDiv = targetEl.closest('div');
        var ulContainer = parentDiv.find('ul');

        e.stopPropagation();

        ulContainer.toggleClass('showActionDropDown');
    },

    changeActionButtonState: function (data) {
        var count = data.length;

        if (count !== 0) {
            this.$actionButton.removeClass('hidden');
            if (this.tabName !== 'archived') {
                this.$editButton.toggle(count === 1);
            } else {
                this.$editButton.hide();
            }
        } else {
            this.$actionButton.addClass('hidden');
        }

        if (this.viewType === 'thumbnails') {
            this.$el.find('#checkAll').prop('checked', data.checkAll);
        }
    },

    changeActionButtons: function (options) {
        var $thisEl = this.$el;
        var keys = Object.keys(options);

        keys.forEach(function (key) {
            $thisEl.find('#' + key).toggle(options[key]);
        });

    },

    checkAll: function (e) {
        this.trigger('checkAll', e);
    },

    changeTranslatedFields: function (translation) {
        var self = this;
        var $curEl = this.$el;
        var $elementsForTranslation = $curEl.find('[data-translation]');

        this.translation = translation;
        $elementsForTranslation.each(function (index, el) {
            var $element = $(el);
            var property = $element.attr('data-translation');

            if (property === 'search') {
                $element.attr('placeholder', self.translation[property]);
            } else {
                $element.html(self.translation[property]);
            }
        });
    },

    render: function () {
        var paginationContainer;
        var $thisEl = this.$el;
        var $createBtn;
        var $archiveBtn;
        var $unArchiveBtn;

        $('title').text(this.contentType);

        $thisEl.html(this.template({
            viewType     : this.viewType,
            contentType  : this.contentType,
            translation  : this.translation,
            currentUserId: this.sendPassForCurrentUser,
            App: App,
        }));

        $thisEl.find('#' + this.tabName).addClass('viewBarTabActive');

        this.$actionButton = $thisEl.find('.actionBtn');
        this.$editButton = $thisEl.find('#editBtn');

        /* $("html").click(function (e) {
         if (!$(e.target).hasClass('filterElement')) {
         thisEl.find('.dropDownContent').toggleClass('showActionDropDown');
         }
         }); */

        paginationContainer = $thisEl.find('#paginationHolder');
        paginationContainer.html(this.paginationTemplate({translation: this.translation}));

        $createBtn = $thisEl.find('#createBtn');
        $archiveBtn = $thisEl.find('#archiveBtn');
        $unArchiveBtn = $thisEl.find('#unArchiveBtn');

        if (this.tabName === 'archived') {
            $archiveBtn.hide();
            $unArchiveBtn.show();
            $createBtn.hide();
        } else {
            $createBtn.show();
            $archiveBtn.show();
            $unArchiveBtn.hide();
        }

        return this;
    }
});

TopBarView.extend = function (childTopBar) {
    var view = Backbone.View.extend.apply(this, arguments);

    view.prototype.events = _.extend({}, this.prototype.events, childTopBar.events);

    return view;
};

module.exports = TopBarView;
