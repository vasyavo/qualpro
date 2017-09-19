var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Cookies = require('js-cookie');
var CONSTANTS = require('../constants/contentType');
var otherConstants = require('../constants/otherConstants');
var FilterView = require('../views/filter/filtersBarView');
var PreView = require('../views/domain/preView/preView');
var FilterBarTemplate = require('../../templates/filter/filterBar.html');
var dataService = require('../dataService');
var FILTERS_CONSTANTS = require('../constants/filters');
var DefFilters = require('../helpers/defFilterLogic');
var ERROR_MESSAGES = require('../constants/errorMessages');
var App = require('../appState');

var View = Backbone.View.extend({
    listLength        : null,
    defaultItemsNumber: null,
    newCollection     : null,
    $pagination       : null,
    rowClicks         : 0,
    filterBarTemplate : _.template(FilterBarTemplate),
    runClickItem      : _.debounce(this.clickItem, 300),
    domainsArray      : [
        CONSTANTS.COUNTRY,
        CONSTANTS.REGION,
        CONSTANTS.SUBREGION,
        CONSTANTS.RETAILSEGMENT,
        CONSTANTS.OUTLET,
        CONSTANTS.BRANCH,
        CONSTANTS.NOTES
    ],

    events: {
        'click .oe_sortable': 'sort',
        'click #checkAll'   : 'checkAll'
    },

    checkAll: function (e) {
        var $el = $(e.target);
        var $thisEl = this.$el;

        var $checkedContent = (this.viewType === 'thumbnails') ?
            $thisEl.find('.thumbnailsItems') : $thisEl.find('.listTable');

        var $checkboxes = $checkedContent.find('input[type="checkbox"]');
        var check = $el.prop('checked');

        $checkboxes.prop('checked', check);
        this.inputClick(e);
    },

    correctView: function (childName) {
        var $currentEl = this.$el;
        var ifBranch = childName ? childName === 'branch' : this.contentType === 'branch';

        $currentEl.find('.forChange').toggle(!ifBranch);
        $currentEl.find('.changeColSpan').attr('colspan', !ifBranch ? 4 : 3);
    },

    getSortField: function ($sortDomEl, isNewPage) {
        var sort = {};
        var sortData = $sortDomEl.attr('data-sort');
        var multilanguageFields = this.collection.models[0].multilanguageFields;
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
            Cookies.get('currentLanguage') || 'en';
        var sortType = parseInt($sortDomEl.find('.sortedArrow').attr('sort-type'), 10);

        if (!isNewPage) {
            $sortDomEl.find('.sortedArrow').attr('sort-type', sortType * -1);
            sortType = sortType * -1;
        }

        if (multilanguageFields && multilanguageFields.indexOf(sortData) !== -1) {
            sort[sortData + '.' + currentLanguage] = sortType;
        } else {
            sort[sortData] = sortType;
        }
        return sort;
    },

    sort: function (e) {
        var $el = $(e.target);
        var $th = $el.closest('th');
        var data;
        var sort;
        var collectionLength = this.collection.length;

        if (!collectionLength) {
            return false;
        }

        $th.siblings('.oe_sortable')
            .removeClass('sorted')
            .find('div')
            .attr('sort-type', 1);

        $th.addClass('sorted');

        sort = this.getSortField($th, false);

        data = {
            sort: sort
        };

        if (this.filter) {
            data.archived = this.filter.archived;
            data.filter = this.filter;
        }

        if (this.parrentContentType) {
            data.contentType = this.parrentContentType;
        }

        if (this.supervisorFilter) {
            data.supervisorFilter = this.supervisorFilter;
        }

        data.newCollection = false;
        data.page = 1;
        this.collection.firstPage(data);
    },

    makeRender: function (options) {
        var self = this;
        _.bindAll(this, 'render', 'afterRender', 'beforeRender');

        this.render = _.wrap(this.render, function (render) {
            self.beforeRender(options);
            render();
            self.afterRender(options);
            return self;
        });
    },

    beforeRender: function (options) {
        if (options.translation) {
            this.translation = options.translation;
        }

        this.contentType = options.contentType;
        this.tabName = options.tabName;
        this.defFilter = options.defFilter;
    },

    afterRender: function (options) {
        var contentType = options.contentType || null;
        var ifFilter = FILTERS_CONSTANTS.FILTERS.hasOwnProperty(contentType);
        var self = this;
        var $curEl = this.$el;

        options.notCheckFilters = this.notCheckFilters;

        if (ifFilter) {
            if (!App.filterCollections) {
                App.filterCollections = {};
            }

            if (!App.filterCollections[contentType] && this.domainsArray.indexOf(contentType) === -1) {
                dataService.getData('/filters/' + contentType, {filter: this.filter}, function (err, result) {
                    if (err) {
                        return App.render(err);
                    }

                    App.filterCollections[contentType] = result;
                    self.appFiltersCollectionLoaded(options);
                });
            } else if (!App.filterCollections[contentType] && this.domainsArray.indexOf(contentType) !== -1) {
                App.filterCollections[contentType] = {};
                this.appFiltersCollectionLoaded(options);
            } else {
                this.appFiltersCollectionLoaded(options);
            }
        }

        $curEl
            .tooltip({
                items   : '*.hoverFullText',
                position: {
                    at       : 'top+40',
                    my       : 'top',
                    collision: 'flip'
                },
                open    : function (event, ui) {
                },
                content : function () {
                    return $(this).prop('innerText');
                }
            });

        $curEl.find('.scrollable').mCustomScrollbar();
        $curEl.find('.tabs').tabs();

        this.runClickItem = _.debounce(this.clickItem, 300);
        this.runClickThumbnail = _.debounce(this.clickThumbnail, 300);

        $curEl.on('dialogbeforeclose', function () {
            var keys;

            if (self.filterView) {
                keys = Object.keys(self.filterView.filter);
                keys.forEach(function (key) {
                    var collection = self.filterView.filtersCollections[key];

                    if (collection) {
                        collection.unselectAll();
                    }
                });

                App.filterCollections = self.filterView.filtersCollections;
            }
        });
        if(!ifFilter){
            App.$preLoader.fadeFn({
                visibleState: false
            });
        }
    },

    appFiltersCollectionLoaded: function (options) {
        var $curEl = this.$el;
        var contentType = options.contentType || null;
        var $filterBar = $curEl.find('.filterBar');
        var self = this;
        var filterHolder;

        if (!$filterBar.length) {
            $filterBar = $curEl.siblings('.topBarHolder').find('.filterBar');
        }

        if ($filterBar.length) {
            if (this.domainsArray.indexOf(contentType) !== -1) {
                $filterBar.html(this.filterBarTemplate({
                    showHeader : false,
                    showClear  : false,
                    translation: options.translation,
                    contentType: contentType
                }));
            } else {
                $filterBar.html(this.filterBarTemplate({
                    contentType: contentType,
                    showHeader : true,
                    translation: options.translation,
                    showClear  : true
                }));
            }

            filterHolder = $filterBar.find('.filtersFullHolder');

            options.el = filterHolder;

            this.filterView = new FilterView(options);
            this.filterView.render();

            this.filterView.bind('filter', function (filter) {
                self.filter = filter;

                if (!self.$el.hasClass('ui-dialog-content ui-widget-content') && !self.$el.parents('.ui-dialog').length) {
                    self.changeLocationHash(1, otherConstants.DEFAULT_PER_PAGE, filter);
                }

                self.trigger('filter');
            });

            this.filterView.bind('collapseActionDropDown', function () {
                self.trigger('collapseActionDropDown');
            });
        }
        App.$preLoader.fadeFn({
            visibleState: false
        });
    },

    changeLocationHash: function (page, count, filter) {
        var location = Backbone.history.fragment;
        var pId = (location.split('/pId=')[1]) ? location.split('/pId=')[1].split('/')[0] : '';
        var rId = (location.split('/rId=')[1]) ? location.split('/rId=')[1].split('/')[0] : '';
        var oId = (location.split('/oId=')[1]) ? location.split('/oId=')[1].split('/')[0] : '';
        var sId = (location.split('/sId=')[1]) ? location.split('/sId=')[1].split('/')[0] : '';
        var domainFilter = this.composeDomainFilter(this.contentType, pId, sId, rId, oId);
        var checkIfDomain = location.split('/')[1] === 'domain';
        var mainLocation;
        var url;
        var thumbnails;
        var locationFilter;
        var value = false;

        filter = _.extend(filter, domainFilter);

        if (!checkIfDomain) {
            mainLocation = 'qualPro/' + this.contentType + '/' + this.tabName + '/' + this.viewType;
        } else {
            mainLocation = 'qualPro/domain/' + this.contentType + '/' + this.tabName + '/' + this.viewType;
        }

        if (!page && this.viewType === 'list') {
            page = (location.split('/p=')[1]) ? location.split('/p=')[1].split('/')[0] : 1;
        }

        if (!count) {
            thumbnails = location.split('thumbnails')[0];
            count = (location.split('/c=')[1]) ? location.split('/c=')[1].split('/')[0] : 100;

            if (thumbnails && count < 100) {
                count = 100;
            }
        }

        url = mainLocation;
        if (pId) {
            url += '/pId=' + pId;
            if (pId.split(',')[1] === 'true') {
                value = true;
            }
        }
        if (sId) {
            url += '/sId=' + sId;
            if (sId.split(',')[1] === 'true') {
                value = true;
            }
        }
        if (rId) {
            url += '/rId=' + rId;
            if (rId.split(',')[1] === 'true') {
                value = true;
            }
        }
        if (oId) {
            url += '/oId=' + oId;
            if (oId.split(',')[1] === 'true') {
                value = true;
            }
        }
        if (page) {
            url += '/p=' + page;
        }
        if (count) {
            url += '/c=' + count;
        }

        this.trigger('hideCreateForBreadCrumbs', value);

        if (!filter) {
            locationFilter = location.split('/filter=')[1];
            if (locationFilter) {
                url += '/filter=' + locationFilter;
            }
        } else {
            //url += '/filter=' + _.escape(JSON.stringify(filter));
            url += '/filter=' + encodeURIComponent(JSON.stringify(filter));
        }

        Backbone.history.navigate(url, false);
    },

    nextPage: function (options) {
        var page = options.page;
        var itemsNumber = options.itemsNumber;
        var sortedField = $('.sorted');
        var sort;

        options = options || {count: itemsNumber};

        options.filter = this.filter;

        if (sortedField.length) {
            sort = this.getSortField(sortedField, true);
            options.sort = sort;
        }

        this.collection.getNextPage(options);
        this.changeLocationHash(page, itemsNumber);
    },

    previousPage: function (options) {
        var page = options.page;
        var itemsNumber = options.itemsNumber;
        var sortedField = $('.sorted');
        var sort;

        options = options || {count: itemsNumber};

        options.filter = this.filter;

        if (sortedField.length) {
            sort = this.getSortField(sortedField, true);
            options.sort = sort;
        }

        this.collection.getPreviousPage(options);
        this.changeLocationHash(page, itemsNumber);
    },

    firstPage: function (options) {
        var itemsNumber = $('#itemsNumber').text();
        var currentShowPage = $('#currentShowPage');
        var page = 1;
        var lastPage = $('#lastPage').text();
        var i;

        currentShowPage.val(page);

        $('#firstShowPage').prop('disabled', true);

        $('#pageList').empty();

        if (lastPage >= 7) {
            for (i = 1;
                 i <= 7;
                 i++) {
                $('#pageList').append('<li class="showPage">' + i + '</li>');
            }
        } else {
            for (i = 1;
                 i <= lastPage;
                 i++) {
                $('#pageList').append('<li class="showPage">' + i + '</li>');
            }
        }
        $('#gridStart').text((page - 1) * itemsNumber + 1);

        if (this.listLength <= 1 * itemsNumber) {
            $('#gridEnd').text(this.listLength);
        } else {
            $('#gridEnd').text(page * itemsNumber);
        }

        $('#previousPage').prop('disabled', true);
        $('#nextPage').prop('disabled', false);
        $('#lastShowPage').prop('disabled', false);

        options = options || {
                count : itemsNumber,
                filter: this.filter
            };

        this.collection.firstPage(options);
        this.changeLocationHash(1, itemsNumber);
    },

    lastPage: function (options) {
        var itemsNumber = $('#itemsNumber').text();
        var page = $('#lastPage').text();
        var i;

        $('#firstShowPage').prop('disabled', true);
        $('#pageList').empty();

        if (page >= 7) {
            for (i = page - 6;
                 i <= page;
                 i++) {
                $('#pageList').append('<li class="showPage">' + i + '</li>');
            }
        } else {
            for (i = 1;
                 i <= page;
                 i++) {
                $('#pageList').append('<li class="showPage">' + i + '</li>');
            }
        }

        $('#currentShowPage').val(page);
        $('#gridStart').text((page - 1) * itemsNumber + 1);

        if (this.listLength <= page * itemsNumber) {
            $('#gridEnd').text(this.listLength);
            $('#nextPage').prop('disabled', true);
        } else {
            $('#gridEnd').text(page * itemsNumber);
        }

        $('#nextPage').prop('disabled', true);
        $('#lastShowPage').prop('disabled', true);
        $('#previousPage').prop('disabled', false);
        $('#firstShowPage').prop('disabled', false);

        options = options || {
                page  : page,
                count : itemsNumber,
                filter: this.filter
            };

        this.collection.getLastPage(options);
        this.changeLocationHash(page, itemsNumber);
    },

    getPage: function (options) {
        var itemsNumber = options.count;
        var page = options.page;
        var filter = this.filter || {};
        var collectionOptions = {
            count : itemsNumber,
            filter: filter
        };

        var sortedField = $('.sorted');
        var sort;

        var filterExtension = this.getFilterExtention();

        collectionOptions.filter = _.extend(collectionOptions.filter, filterExtension);

        if (sortedField.length) {
            sort = this.getSortField(sortedField, true);
            collectionOptions.sort = sort;
        }

        /*this.defFilter = $.extend({}, collectionOptions.filter);
         this.filter = $.extend({}, collectionOptions.filter);  */

        this.collection.getPage(page, collectionOptions);
        this.changeLocationHash(page, itemsNumber);
    },

    switchPageCounter: function (e) {
        var self = this;
        var itemsNumber = e.target.textContent;

        e.preventDefault();

        this.defaultItemsNumber = itemsNumber;
        this.$el.find('#checkAll').prop('checked', false);

        this.collection.getPage(1, {
            count        : itemsNumber,
            page         : 1,
            filter       : this.filter,
            newCollection: false
        });

        this.changeLocationHash(1, itemsNumber);
    },

    pageAnimation: function (direction, $holder) {
        var $absolute = $holder.find('.absoluteContent');
        App.$preLoader.fadeFn({
            visibleState: false
        });

        if ($absolute.length) {
            $holder = $absolute;
        }

        if (!direction) {
            $holder.removeClass('contentFadeInLeft');
            $holder.removeClass('contentFadeInRight');
            $holder.removeClass('contentFadeOutLeft');
            $holder.addClass('contentFadeOutRight');
        } else {
            $holder.removeClass('contentFadeInLeft');
            $holder.removeClass('contentFadeInRight');
            $holder.removeClass('contentFadeOutRight');
            $holder.addClass('contentFadeOutLeft');
        }

        setTimeout(function () {
            if (!direction) {
                $holder.addClass('contentFadeInLeft');
                $holder.removeClass('contentFadeOutRight');
            } else {
                $holder.addClass('contentFadeInRight');
                $holder.removeClass('contentFadeOutLeft');
            }
        }, 300);
    },

    // </editor-fold>

    // <editor-fold desc='Checkboxes'>

    addCheckboxesFunctionality: function (context) {
        var currentEl;

        if (!context) {
            context = this;
        }

        currentEl = context.$el;

        currentEl.find('.checkbox').click(function (e) {
            e.stopPropagation();

            setViewStateAfterCheck();
        });

        currentEl.find('.checkboxArea').click(function (e) {
            var checkbox;

            e.stopPropagation();
            checkbox = $(e.target).children('input:checkbox');
            checkbox.prop('checked', !checkbox.is(':checked'));

            setViewStateAfterCheck();
        });

        var setViewStateAfterCheck = function () {

            if (!context.$checkAll) {
                //todo change after button behavior adding
                return;
            }

            var checkLength;
            var collectionLength = context.collection.length;
            if (collectionLength > 0) {
                checkLength = $('input.checkbox:checked').length;

                if (checkLength === collectionLength) {
                    context.$checkAll.prop('checked', true);
                } else {
                    context.$checkAll.prop('checked', false);
                }
            }
        };

    },

    checked: function (e) {
        e.stopPropagation();
    },

    checklistRow: function (e) {
        var $targetEl = $(e.target);
        var $targetDivContainer = $targetEl.closest('.listRow');
        var $checkbox = $targetDivContainer.find('input[type="checkbox"]');
        var checked = $checkbox.prop('checked');

        $checkbox.prop('checked', !checked);
        this.inputClick(e);
    },

    inputClick: function (e) {
        var checkBoxes = this.$el.find('input[type="checkbox"]:checked:not(#checkAll)');
        var currentChecked = $(e.target);
        var checkAllBool = (checkBoxes.length === this.collection.length);

        if (currentChecked.attr('id') !== 'checkAll') {
            if (checkAllBool) {
                this.$el.find('#checkAll').prop('checked', true);
            } else {
                this.$el.find('#checkAll').prop('checked', false);
            }
        }

        this.trigger('selectedElementsChanged', {
            length  : checkBoxes.length,
            $element: currentChecked,
            checkAll: checkAllBool
        });

        e.stopPropagation();
    },

    createItem: function (options) {
        var contentType = this.contentType;
        var viewType = this.viewType;
        var parentId = this.parentId;
        var translation = this.translation;
        var modelUrl = '../models/' + contentType;
        var self = this;
        var CreateView = this.CreateView;

        options = options || {};

        var Model = require(modelUrl);

        var createView;
        var creationOptions = {
            Model      : Model,
            contentType: contentType,
            viewType   : viewType,
            parentId   : parentId,
            translation: translation
        };

        if (options.model) {
            creationOptions.model = options.model;
        }

        if (options.edit) {
            creationOptions.edit = true;
        }

        createView = new CreateView(creationOptions);

        createView.on('itemSaved', function () {
            self.collection.getPage(1, {filter: self.filter});
        });

        createView.on('modelSaved', function (model) {
            if (self.tabName === 'all' || self.tabName === 'createdByMe') {
                self.addReplaceRow(model);
            }
        });
    },

    editItem: function (id) {
        var contentType = this.contentType;
        var viewType = this.viewType;
        var parentId = this.parentId;
        var translation = this.translation;
        var currentId = id || this.$el.find('input[type="checkbox"]:checked:not(#checkAll)').attr('id');
        var model = currentId.toJSON ? currentId : this.collection.get(currentId);
        var self = this;

        var editView = new this.EditView({
            model       : model,
            contentType : contentType,
            viewType    : viewType,
            parentId    : parentId,
            translation : translation,
            CoverPreview: this.CoverPreview
        });

        editView.on('itemArchived', function () {
            self.collection.getPage(1);
        });

        editView.on('modelSaved', function (model) {
            if (App.currentUser._id === model.get('_id')) {
                App.currentUser = model.toJSON();
                self.trigger('renderCurrentUserInfo');
            }

            self.addReplaceRow(model);
        });
    },

    incClicks: function (e) {
        this.rowClicks += 1;
        this.runClickItem(e);
    },

    clickItem: function (e) {
        var clicks = this.rowClicks;

        this.rowClicks = 0;

        if (clicks === 1) {
            this.checklistRow(e);
        } else {
            this.listRowClick(e);
        }
    },

    previewItem: function (id) {
        var contentType = this.contentType;
        var viewType = this.viewType;
        var parentId = this.parentId;
        var translation = this.translation;
        var curentId = id ? id : this.$el.find('input[type="checkbox"]:checked').attr('id');
        var model = this.collection.get(curentId);

        new PreView({
            model      : model,
            contentType: contentType,
            viewType   : viewType,
            parentId   : parentId,
            translation: translation
        });
    },

    archiveItems: function (e, idsToArchive) {
        var self = this;
        var showPopUp = e.showPopUp;
        var $el;
        var value;
        var action;

        if (showPopUp === false) {
            this.archiveItems_(e, idsToArchive);
        } else {
            $el = $(e.target);
            value = $el.attr('id');

            if (value === 'archiveBtn') {
                action = 'archive';
            } else {
                action = 'unArchive';
            }

            App.showPopUp({
                contentType: this.contentType,
                action     : action,
                saveCb     : function () {
                    self.archiveItems_(e, idsToArchive);
                    $(this).dialog('destroy').remove();
                }
            });
        }
    },

    archiveItems_: function (e, idsToArchive) {
        var currentLanguage = App.currentUser.currentLanguage;
        var checkboxes = (!e.notPushChecked) ? this.$el.find('input:checkbox:checked') : null;
        var $el = $(e.target);
        var data = {};
        var self = this;
        var value = $el.attr('id') === 'archiveBtn';
        var contentType = this.contentType;
        var url;

        if (contentType === 'itemsPrices') {
            contentType = 'item';
        }

        url = '/' + contentType + '/remove';

        idsToArchive = idsToArchive || [];

        if (!e.notPushChecked) {
            checkboxes.each(function (i) {
                var id = $(checkboxes[i]).val();

                idsToArchive.push(id);
            });

            checkboxes.click();
        }

        data.ids = idsToArchive;
        data.archived = value;
        data.type = contentType;

        if (this.domainsArray.indexOf(this.contentType) !== -1) {
            data.filter = this.filter;
        }

        dataService.putData(url, data, function (err, result) {
            var message;

            if (err) {
                if (err.status === 403) {
                    switch (self.contentType) {
                        case CONSTANTS.DOCUMENTS:
                            message = ERROR_MESSAGES.documentArchiveForbidden[currentLanguage];
                            break;
                        default:
                            message = 'Something went wrong';
                    }

                    return App.renderErrors([message]);
                }
                return App.render(err);
            }

            var tabId = data.archived ? 'archived' : 'all';

            self.trigger('changeTabs', tabId);
        });

    },

    composeDomainFilter: function (domainType, parentId, subRegionId, retailSegmentId, outletId) {
        if (parentId) {
            parentId = parentId.split(',')[0];
        }

        if (subRegionId) {
            subRegionId = subRegionId.split(',')[0];
        }

        if (retailSegmentId) {
            retailSegmentId = retailSegmentId.split(',')[0];
        }

        if (outletId) {
            outletId = outletId.split(',')[0];
        }

        switch (domainType) {
            case CONSTANTS.COUNTRY:
                return {};
            case CONSTANTS.REGION:
            case CONSTANTS.SUBREGION:
                if (parentId) {
                    return {parent: {values: [parentId], type: 'ObjectId'}};
                } else {
                    return {};
                }
            case CONSTANTS.RETAILSEGMENT:
                if (subRegionId) {
                    return {subRegions: {values: [subRegionId], type: 'ObjectId'}};
                } else {
                    return {};
                }
            case CONSTANTS.OUTLET:
                if (subRegionId && retailSegmentId) {
                    return {
                        subRegions    : {values: [subRegionId], type: 'ObjectId'},
                        retailSegments: {values: [retailSegmentId], type: 'ObjectId'}
                    };
                } else {
                    return {};
                }
            case CONSTANTS.BRANCH:
                if (subRegionId && retailSegmentId && outletId) {
                    return {
                        subRegion    : {values: [subRegionId], type: 'ObjectId'},
                        retailSegment: {values: [retailSegmentId], type: 'ObjectId'},
                        outlet       : {values: [outletId], type: 'ObjectId'}
                    };
                } else {
                    return {};
                }
        }
    },

    getFilterExtention: function () {
        var location = window.location.hash;
        var idLocation;
        var regexp;
        var ids = {};
        var idsArchivedArray = [];
        var idsArray = ['pId', 'oId', 'rId', 'sId'];
        var filterExtension;

        idsArray.forEach(function (idName) {
            //regexp = new RegExp(idName + '=(.*?)\/?');
            regexp = new RegExp(idName + '=(.*?)(\/|$)');
            idLocation = regexp.exec(location);
            ids[idName] = idLocation ? idLocation[1].split(',')[0] : '';
            idsArchivedArray.push(idLocation ? idLocation[1].split(',')[1] : '');
        });

        filterExtension = this.composeDomainFilter(this.contentType, ids.pId, ids.sId, ids.rId, ids.oId);

        return filterExtension;
    },

    showFilteredContent: function (tabName) {
        var itemsNumber = $('#itemsNumber').text();
        var creationOptions;

        var defaultFilters = new DefFilters(App.currentUser._id);
        var filter = defaultFilters.getDefFilter(this.contentType, tabName);

        var filterExtension = this.getFilterExtention();

        this.tabName = tabName;

        creationOptions = {
            viewType     : this.viewType,
            filter       : filter,
            parentId     : this.parentId,
            newCollection: false
        };

        creationOptions.filter = _.extend(creationOptions.filter, filterExtension);

        this.defFilter = $.extend({}, creationOptions.filter);
        this.filter = $.extend({}, creationOptions.filter);

        if (this.filterView) {
            this.filterView.trigger('tabsChanged', this.defFilter);
        }

        this.changeLocationHash(1, itemsNumber, filter);
        this.collection.getPage(1, creationOptions);
    },

    addReplaceRow: function (model) {
        var $curEl = this.$el;
        var $listTable = $curEl.find('.listTable');
        var id = model.get('_id');
        var $listRow = $listTable.find('.listRow[data-id = "' + id + '"]');
        var modelJSON = model.toJSON();
        var totalRecords = this.collection.totalRecords;
        var pageSize = this.collection.pageSize;
        var currentPage = this.collection.currentPage;
        var totalPages = Math.ceil(totalRecords / pageSize);
        var recordsOnLastPage = pageSize - (totalPages * pageSize - totalRecords);

        if ($listRow.length) {
            $listRow.replaceWith(this.templateNew({model: modelJSON, translation: this.translation}));
            if (this.preView) {
                this.preView.trigger('updatePreview', model);
            }

            this.collection.add(modelJSON, {merge: true});
        } else {
            $curEl.find('.noData').remove();
            this.collection.add(modelJSON, {remove: false});
            this.trigger('pagination', {
                length     : ++this.collection.totalRecords,
                currentPage: this.collection.currentPage,
                itemsNumber: ((currentPage === totalPages) && (recordsOnLastPage < pageSize)) ? this.collection.pageSize : ++this.collection.pageSize
            });
            $listTable.prepend(this.templateNew({
                model      : modelJSON,
                translation: this.translation
            }));
        }

        this.trigger('hideActionDd');
    },

    changeTranslatedFields: function (translation) {
        var self = this;
        var $curEl = this.$el;
        var $elementsForTranslation = $curEl.find('[data-translation]');

        this.translation = translation;
        $elementsForTranslation.each(function (index, el) {
            var $element = $(el);
            var property = $element.attr('data-translation');

            $element.html(self.translation[property]);
        });

        if (this.filterView) {
            this.filterView.changeTranslatedFields();
        }

    }

});

View.extend = function (childView) {
    var view = Backbone.View.extend.apply(this, arguments);

    view.prototype.events = _.extend({}, this.prototype.events, childView.events);

    return view;
};

module.exports = View;
