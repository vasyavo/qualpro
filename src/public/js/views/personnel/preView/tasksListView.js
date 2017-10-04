var $ = require('jquery');
var _ = require('underscore');
var moment = require('moment');
var paginationTemplate = require('../../../../templates/pagination/pagination.html');
var objectivesNewRow = require('../../../../templates/objectives/list/newRow.html');
var inStoreTasksNewRow = require('../../../../templates/inStoreTasks/list/newRow.html');
var createView = require('../../../views/objectives/createView');
var CreateSubObjectivesView = require('../../../views/objectives/createSubObjectivesView');
var EditObjectiveView = require('../../../views/objectives/editObjectiveView');
var ObjectivesPreView = require('../../../views/objectives/preView/preView');
var InStoreTasksPreview = require('../../../views/inStoreTasks/preView/preView');
var filterView = require('../../../views/filter/filtersBarView');
var paginator = require('../../../views/paginator');
var baseTopBar = require('../../../views/baseTopBar');
var ObjectivesCollection = require('../../../collections/personnel/personnelTasks');
var CONSTANTS = require('../../../constants/otherConstants');
var CONTENT_TYPES = require('../../../constants/contentType');
var App = require('../../../appState');

var dateFormat = function (date) {
    return moment(date).format('DD.MM.YYYY');
};

module.exports = paginator.extend({
    contentType       : 'personnelTasks',
    viewType          : 'list',
    paginationTemplate: _.template(paginationTemplate),
    templateObjective : _.template(objectivesNewRow),
    templateInStore   : _.template(inStoreTasksNewRow),

    events: {
        'click .listRow'                  : 'listRowClick',
        'click .itemsNumber'              : 'switchPageCounter',
        'change #currentShowPage'         : 'showPage',
        'click .showPage'                 : 'showPage',
        'click #previousPage'             : 'previousPage',
        'click #nextPage'                 : 'nextPage',
        'click .allPage, .currentPageList': 'showPagesPopup',
        'click .filterHeader'             : 'toggleFilterHolder'
    },

    initialize: function (options) {

        this.translation = options.translation;
        this.personnelId = options.personnelId || App.currentUser._id;

        this.rowsTemplates = {};
        this.rowsTemplates[CONTENT_TYPES.OBJECTIVES] = this.templateObjective;
        this.rowsTemplates[CONTENT_TYPES.INSTORETASKS] = this.templateInStore;

        options.dialog = true;
        this.translation = options.translation;

        options.defFilter = this.getFilters('monthly');

        this.setFilters(options);

        this.collection = new ObjectivesCollection({filter: this.filter});
        this.defaultItemsNumber = this.collection.pageSize;
        this.listLength = this.collection.totalRecords;

        options.contentType = this.contentType;
        options.filter = this.filter;
        this.makeRender(options);

        this.bind('getNewData', function (id) {
            this.setFilters({
                defFilter: this.getFilters(id)
            });
            this.filterView.clearMethod();
        }, this);

        this.collection.bind('reset', this.render, this);
        this.collection.bind('showMore', this.showMoreContent, this);
        this.bind('filter', this.showFilteredPage, this);
    },

    setFilters: function (options) {
        this.filter = options.filter || {};
        this.defFilter = options.defFilter;
        this.filter = $.extend({}, this.filter, this.defFilter);

        if (this.filterView) {
            this.filterView.filter = this.filter;
            this.filterView.defFilter = this.defFilter;
        }
    },

    getFilters: function (period) {
        var id = this.personnelId;
        var date = new Date();
        var startDate = new Date(date);
        var endDate = new Date(date);
        var dateOfMonth = date.getDate();
        var month = date.getMonth();
        var values = App.currentUser.covered ? Object.keys(App.currentUser.covered) : [];

        values.push(id);

        if (period === 'monthly') {
            if (dateOfMonth >= 10) {
                month += 1;
            }

            startDate.setMonth(month - 1);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0);

            endDate.setMonth(month);
            endDate.setDate(0);
            endDate.setHours(23, 59, 0);
        } else {
            startDate.setMonth(month - 6);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0);

            endDate.setMonth(month + 1);
            endDate.setDate(0);
            endDate.setHours(23, 59, 0);
        }

        return {
            assignedTo: {
                type  : 'ObjectId',
                values: values
            },

            time: {
                names : [dateFormat(startDate), dateFormat(endDate)],
                type  : 'date',
                values: [startDate, endDate]
            }
        };
    },

    listRowClick: function (e) {
        var self = this;
        var targetEl = $(e.target);
        var targetRow = targetEl.closest('.listRow');
        var id = targetRow.attr('data-id');
        var model = this.collection.get(id);
        var PreView = model.get('context') === CONTENT_TYPES.INSTORETASKS ? InStoreTasksPreview : ObjectivesPreView;

        this.preView = new PreView({
            model      : model,
            translation: self.translation
        });
        this.preView.on('modelSaved', function (model) {
            self.templateNew = self.rowsTemplates[model.context || 'objectives'];
            self.collection.add(model, {merge: true});
            self.addReplaceRow(model);

        });
        this.preView.on('showSubObjectiveDialog', this.showSubObjectiveDialog, this);
        this.preView.on('showAssignObjectiveDialog', this.showAssignObjectiveDialog, this);
        this.preView.on('showEditObjectiveDialog', this.showEditObjectiveDialog, this);
    },

    showEditObjectiveDialog: function (model) {
        var self = this;

        this.editObjectiveView = new EditObjectiveView({
            model      : model,
            translation: this.translation
        });

        this.editObjectiveView.on('modelSaved', function (model) {
            self.templateNew = self.rowsTemplates[model.context || 'objectives'];
            self.collection.add(model, {merge: true});
            self.addReplaceRow(model);

        });
    },

    showAssignObjectiveDialog: function (model, multiselect) {
        this.assignObjectiveView = new CreateSubObjectivesView({
            model      : model, /*assign: true,*/
            multiselect: multiselect,
            translation: this.translation
        });
    },

    showSubObjectiveDialog: function (model) {
        this.createSubObjectivesView = new CreateSubObjectivesView({
            model      : model,
            translation: this.translation
        });
    },

    toggleFilterHolder: function (e) {
        var $target = $(e.target);
        var $filterBar = $target.closest('.filterBar');
        var $filterBarName = $filterBar.find('.filterHeader');
        var $filterContentHolder = $filterBar.find('.filterContentHolder');

        if ($target.closest('.searchInputWrap').length) {
            return false;
        }

        $filterBarName.toggleClass('downArrow');
        $filterBarName.toggleClass('upArrow');

        $filterBar.toggleClass('filterBarCollapse');
        this.$el.find('.scrollable').mCustomScrollbar('update');
    },

    preventDefaults: function (e) {
        e.preventDefault();
        e.stopPropagation();
    },

    switchPageCounter: function (e) {
        var $ul = $(e.target).closest('ul');
        var itemsNumber;

        this.preventDefaults(e);

        $ul.toggle();

        itemsNumber = e.target.textContent;

        this.defaultItemsNumber = itemsNumber;

        this.collection.getPage(1, {
            count        : itemsNumber,
            page         : 1,
            filter       : $.extend({}, this.filter, this.defFilter),
            newCollection: false
        });
    },

    setPagination: function (options) {
        var $curEl = this.$el;
        var $pageList = $curEl.find('#pageList');
        var $curPageInput = $curEl.find('#currentShowPage');
        var $itemsNumber = $curEl.find('#itemsNumber');

        var currentPage = parseInt(options.currentPage) || parseInt($curPageInput.val());
        var itemsNumber = parseInt(options.itemsNumber) || parseInt($itemsNumber.text());

        var $gridStart = this.$el.find('#gridStart');
        var $gridEnd = this.$el.find('#gridEnd');
        var $gridCount = this.$el.find('#gridCount');

        var gridCount;
        var gridStartValue;
        var gridEndValue;
        var pageNumber;
        var $lastPage;

        currentPage = isNaN(currentPage) ? 1 : currentPage;

        if (isNaN(itemsNumber)) {
            itemsNumber = CONSTANTS.DEFAULT_PER_PAGE;
        }

        gridCount = (options.length >= 0) ? options.length : parseInt($gridCount.text());
        gridStartValue = (currentPage - 1) * itemsNumber;
        gridEndValue = gridStartValue + itemsNumber;

        $gridCount.text(gridCount);

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

            for (var i = 1; i <= pageNumber; i++) {
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

        if (options.itemsNumber) {
            $itemsNumber.text(itemsNumber);
        }

        $curPageInput.val(currentPage);
    },

    showFilteredPage: function () {
        var $curEl = this.$el;
        var $itemsNumber = $curEl.find('#itemsNumber');
        var itemsNumber = $itemsNumber.text();
        var collectionOptions = {
            count : itemsNumber,
            filter: $.extend({}, this.filter, this.defFilter)
        };

        this.setPagination({currentPage: 1, itemsNumber: itemsNumber});

        this.collection.firstPage(collectionOptions);
    },

    showPage: function (e) {
        var $curEl = this.$el;
        var $target = $(e.target);
        var $ulContent = $target.closest('.allNumberPerPage');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = $target.text();
        var itemsNumber = $itemsNumber.text();

        this.setPagination({currentPage: currentPage, itemsNumber: itemsNumber});

        this.preventDefaults(e);

        this.collection.getPage(currentPage, {
            count : itemsNumber,
            page  : currentPage,
            filter: $.extend({}, this.filter, this.defFilter)
        });

        $ulContent.toggle();
    },

    previousPage: function (e) {
        var $curEl = this.$el;
        var $curPageInput = $curEl.find('#currentShowPage');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = parseInt($curPageInput.val()) - 1;
        var itemsNumber = parseInt($itemsNumber.text());
        var options;

        this.preventDefaults(e);

        options = {
            page  : currentPage,
            count : itemsNumber,
            filter: $.extend({}, this.filter, this.defFilter)
        };

        this.collection.getPreviousPage(options);
    },

    nextPage: function (e) {
        var $curEl = this.$el;
        var $lastPage = $curEl.find('#lastPage');
        var $curPageInput = $curEl.find('#currentShowPage');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = parseInt($curPageInput.val()) + 1;
        var itemsNumber = parseInt($itemsNumber.text());
        var lastPage = parseInt($lastPage.text());
        var options;

        if (currentPage > lastPage) {
            currentPage = lastPage;
        }

        this.preventDefaults(e);

        options = {
            page  : currentPage,
            count : itemsNumber,
            filter: $.extend({}, this.filter, this.defFilter)
        };

        this.collection.getNextPage(options);
    },

    showPagesPopup: function (e) {
        var target = $(e.target);
        var curUl = target.closest('button').next('ul');

        curUl.toggle();

        return false;
    },

    render: function () {
        var $currentEl = this.$el;
        var collection = this.collection;
        var jsonCollection = collection.toJSON();
        var $holder;
        var self = this;

        $currentEl.html('<div class="filterBar"></div>');
        $currentEl.append('<div id="paginationHolder" class="paginationHolder"></div>');
        $currentEl.append('<div class="stretchWrap"><div class="absoluteContent listnailsWrap"><div class="listnailsHolder scrollable"><div class="listTable"></div></div></div></div>');

        $holder = $currentEl.find('.listTable');

        jsonCollection.forEach(function (model) {
            $holder.append(self.rowsTemplates[model.context || 'objectives']({
                model      : model,
                translation: self.translation,
                App: App,
            }));
        });

        $currentEl.find('#paginationHolder').html(this.paginationTemplate({
            translation: this.translation
        }));

        this.setPagination({
            length     : collection.totalRecords,
            currentPage: collection.currentPage,
            itemsNumber: collection.pageSize
        });

        return this;
    },

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var $holder = $currentEl.find('.listTable');
        var jsonCollection = newModels.toJSON();
        var self = this;

        this.pageAnimation(this.collection.direction, $holder);

        $holder.empty();

        jsonCollection.forEach(function (model) {
            $holder.append(self.rowsTemplates[model.context || 'objectives']({
                model      : model,
                translation: self.translation,
                App: App,
            }));
        });

        this.setPagination({
            length     : newModels.totalRecords,
            currentPage: newModels.currentPage,
            itemsNumber: newModels.pageSize
        });
    }
});
