var $ = require('jQuery');
var _ = require('underscore');
var Backbone = require('backbone');
var Cookies = require('js-cookie');
var FILTERSCONSTANTS = require('../../constants/filters');
var filterElements = require('../../../templates/filter/filterElements.html');
var filtersEmptySearchResultTemplate = require('../../../templates/filter/filters-empty-search-result.html');
var FilterCollection = require('../../collections/filter/filterCollection');
var TimeView = require('../../views/filter/timeView');

module.exports = Backbone.View.extend({
    elementsTemplate  : _.template(filterElements),
    currentPage       : 1,
    currentCheckedPage: 1,
    updateNames       : true,

    events: {
        'click .filterValues li:not(.fixedPeriod)': 'parrentSelectValue',
        'click .dropDown'                         : 'showHideEvent',
        'click .pencil'                           : 'showHideEvent',
        'click .fixedPeriod'                      : 'showFixedPeriod',
        'click .select-all'                       : 'selectAllFilterValues'
    },

    initialize: function (options) {
        var self = this;

        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
            Cookies.get('currentLanguage') || 'en';

        _.bindAll(this, 'beforeRenderContent');

        this.translation = options.translation;
        this.filterName = options.filterName;
        this.collection = options.valuesCollection;
        this.filerConstants = options.filerConstants;
        this.filterDisplayName = options.filerConstants.displayName;
        this.mandatory = options.filerConstants.mandatory;
        this.currentFilter = options.currentFilter;
        this.filter = options.filter;
        this.defFilter = options.defFilter;
        this.contentType = options.contentType;
        this.filterBarView = options.filterBarView;

        this.optionsElementToShow = options.elementToShow;

        this.filteredCollection = new FilterCollection(this.collection.toJSON());

        this.collection.on('reset', function () {
            var models = self.collection.toJSON();

            self.filteredCollection.reset(models);
        });

        this.filteredCollection.on('reset', _.debounce(function () {
            self.beforeRenderContent();
            self.filteredCollection.trigger('showContent');
        }), 500);

        this.inputEvent = _.debounce(
            function (e) {
                var $target = $(e.currentTarget);
                var value = $target.val();
                var newFilteredCollection;
                var $fullContainer = $target.closest('.filterFullContainer');
                var $dropDown = $fullContainer.find('.dropDownContent');

                self.filteredCollection.on('showContent', function () {
                    $dropDown.toggle(true);
                    self.filteredCollection.off('showContent');
                });

                if (!value) {
                    return self.filteredCollection.reset(self.collection.toJSON());
                }

                newFilteredCollection = this.filterCollection(value);

                self.filteredCollection.reset(newFilteredCollection);
            }, 500);
    },

    selectAllFilterValues : function (event) {
        var selectAllLi = $(event.target).parent();
        var isSelectAllChecked = selectAllLi.hasClass('checkedValue');

        if (isSelectAllChecked) {
            selectAllLi.removeClass('checkedValue');

            delete this.filter[this.filterName];
        } else {
            selectAllLi.addClass('checkedValue');

            var jsonCollection = this.collection.toJSON();

            var filters = {
                type : 'ObjectId',
                names : [],
                values : []
            };

            jsonCollection.map((model) => {
                filters.names.push(model.name[App.currentUser.currentLanguage]);
                filters.values.push(model._id);
            });

            this.filter[this.filterName] = filters;
        }

        this.trigger('reloadFilters', this.filterName);
    },

    parrentSelectValue: function (e) {
        var $currentElement = $(e.currentTarget);
        var currentValue = $currentElement.attr('data-value');
        var currentName = $currentElement.text().trim();
        var checkElement = !$currentElement.hasClass('checkedValue');
        var options = {
            $currentElement: $currentElement,
            currentValue   : currentValue,
            currentName    : currentName,
            checkElement   : checkElement,
            mandatory      : this.mandatory
        };

        if (!checkElement && this.defFilter && this.defFilter[this.filterName] && !this.defFilter[this.filterName].options) {
            return false;
        }

        options.$filterNameElement = this.$el.find('.filterName');
        options.filterName = options.$filterNameElement.attr('data-value');

        App.storage.save('currentCheckedFilter', options.filterName);

        $currentElement.toggleClass('checkedValue');

        this.filterBarView.clearFiltersBelow(options);

        this.selectValue(options);

        if (this.collection.length === this.filter[this.filterName].values.length) {
            $(`#select-all-${this.filterName}`).children('li').addClass('checkedValue');
        } else {
            $(`#select-all-${this.filterName}`).children('li').removeClass('checkedValue');
        }

        if (this.filter[this.filterName] && !this.filter[this.filterName].values.length) {
            delete this.filter[this.filterName];
        }

        this.trigger('reloadFilters', this.filterName);
    },

    showFixedPeriod: function (e) {
        var self = this;
        var $currentElement = $(e.currentTarget);
        var filterValues;
        var currentValue = $currentElement.attr('data-value');
        var currentName = $currentElement.text().trim();
        var checkElement = !$currentElement.hasClass('checkedValue');
        var options = {
            $currentElement: $currentElement,
            currentValue   : currentValue,
            currentName    : currentName,
            checkElement   : checkElement,
            mandatory      : this.mandatory
        };
        options.$filterNameElement = this.$el.find('.filterName');
        options.filterName = options.$filterNameElement.attr('data-value');

        this.timeView = new TimeView();
        this.timeView.on('dateSelected', function (data) {
            self.checkFilterElement(options);
            self.$el.find('.current').removeClass('current');
            self.trigger('selectValue', options);
            filterValues = [data.fromTime, data.toTime];

            self.filter.time = {
                values: filterValues,
                type  : 'date',
                names : ['Fixed Period']
            };
            self.$el.find('input').val(self.filter.time.names.join(', '));
            self.$el.find('.current').removeClass('current');
            App.storage.save('currentCheckedFilter', 'Fixed Period');

            $currentElement.toggleClass('checkedValue');
            self.trigger('reloadFilters', App.filterCollections[self.contentType], false, self.filterName);
        });
    },

    updateFilterNameElement: function (options, filterNames) {
        var namesString = filterNames.join(', ');

        options.$filterNameElement.find('input')
            .val(namesString)
            .attr('data-val', namesString);
        options.$filterNameElement
            .find(options.isCheckedUlContainer ? '.pencil' : '.dropDown')
            .addClass('current');

        if (filterNames.length) {
            options.$filterNameElement.addClass('checkedGroup');
        } else {
            options.$filterNameElement.removeClass('checkedGroup');
        }

        options.$filterNameElement.addClass('currentGroup');
    },

    filterCollection: function (value) {
        var resultCollection;
        var regex;

        regex = new RegExp(value, 'i');

        resultCollection = this.collection.filter(function (model) {
            var name = model.get('name');
            var nameEn = model.get('name').en || '';
            var nameAr = model.get('name').ar || '';

            if (nameEn.match(regex) || nameAr.match(regex)) {
                return model;
            }
        });

        return resultCollection;
    },

    makePagination: function (paginationLi, obj) {
        var prevPage;
        var nextPage;
        var length = obj.collectionLength;
        var status = length > obj.elementsToShow;
        var allPages = Math.ceil(length / obj.elementsToShow);

        if (status) {
            paginationLi.find('.gridStart').html((obj.start + 1));
            paginationLi.find('.gridEnd').html(obj.end);
            paginationLi.find('.length').html(length);
            paginationLi.show();
        } else {
            paginationLi.hide();
        }

        if (obj.checked) {
            this.allCheckedPages = allPages;
        } else {
            this.allPages = allPages;
        }

        prevPage = paginationLi.find('.prev');
        nextPage = paginationLi.find('.next');

        if (obj.currentPage === 1 && !prevPage.hasClass('disabled')) {
            prevPage.addClass('disabled');
            nextPage.removeClass('disabled');
        } else if (obj.currentPage === 1 && prevPage.hasClass('disabled')) {
            prevPage.addClass('disabled');
            nextPage.removeClass('disabled');
        } else if (obj.currentPage === allPages && !nextPage.hasClass('disabled')) {
            nextPage.addClass('disabled');
            prevPage.removeClass('disabled');
        } else {
            prevPage.removeClass('disabled');
            nextPage.removeClass('disabled');
        }
    },

    paginationChange: function (e, context) {
        var $target = $(e.target);
        var $curEl = $target.closest('a');
        var $categoryValues = $curEl.closest('.dropDownContent');
        var checked = $categoryValues.hasClass('checked');
        var currentPage = checked ? context.currentCheckedPage : context.currentPage;
        var direction = $curEl.hasClass('prev') ? -1 : 1;
        var allPages = checked ? context.allCheckedPages : context.allPages;

        e.stopPropagation();

        currentPage = currentPage + direction;
        currentPage = currentPage < 0 ? 0 : currentPage > allPages ? allPages : currentPage;

        if (checked) {
            context.currentCheckedPage = currentPage;
            return context.renderContent({notHideValues: true}, this.checkedCollection, true);
        }

        context.currentPage = currentPage;
        return context.renderContent({notHideValues: true}, this.uncheckedCollection, false);
    },

    showHideEvent: function (e) {
        var $target;
        e.stopPropagation();
        $target = $(e.target);

        this.showHideValues($target);
    },

    showHideValues: function ($element) {
        var $filterGroupContainer = $element.closest('.filterFullContainer');
        var $fullFilterGroupHolder = $filterGroupContainer.closest('.filtersFullHolder');
        var $ulContent;

        if (!$element.hasClass('pencil')) {
            $ulContent = $filterGroupContainer.find('.ulContent:not(.checked)');
        } else {
            $ulContent = $filterGroupContainer.find('.ulContent.checked');
        }

        $fullFilterGroupHolder.find('.ulContent').not($ulContent).hide();

        this.trigger('collapseActionDropDown');

        $ulContent.toggle();
        // $filterGroupContainer.toggleClass('activeGroup');
    },

    reRenderInput: function () {
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
            Cookies.get('currentLanguage') || 'en';
        var anotherLanguage = (currentLanguage === 'en') ? 'ar' : 'en';
        this.collection = new FilterCollection(this.collection.models, {parse: true, fetch: false});
        var jsonCollection = this.collection.toJSON();
        var filterInput = this.$el.find('input.' + this.filterName + 'Input');
        var selectedValues = _.map(jsonCollection, function (model) {
            if (model.status) {
                return model.name[currentLanguage] || model.name[anotherLanguage];
            }

            return false;
        });
        var selectedValuesNames = _.compact(selectedValues);

        filterInput.val(selectedValuesNames.join(', '));
    },

    beforeRenderContent: function (options) {
        var dividedCollection;
        var $filterNameElement = this.$el.find('.filterName');
        var names = this.filter[this.filterName] && !this.filter[this.filterName].options ? this.filter[this.filterName].names : [];

        if (this.updateNames) {
            this.updateFilterNameElement({
                $filterNameElement  : $filterNameElement,
                isCheckedUlContainer: false
            }, names);
        }
        dividedCollection = this.filteredCollection.getDividedCollections();

        this.checkedCollection = new FilterCollection(dividedCollection.checked, {
            parse: true,
            fetch: false
        });
        this.checkedCollection = this.checkedCollection.toJSON();
        this.uncheckedCollection = new FilterCollection(dividedCollection.unchecked, {
            parse: true,
            fetch: false
        });
        this.uncheckedCollection = this.uncheckedCollection.toJSON();

        if (!options) {
            options = {
                notHideValues: false
            };
        }

        this.renderContent(options, this.checkedCollection, true);
        this.renderContent(options, this.uncheckedCollection, false);
    },

    renderContent: function (options, collection, checked) {
        var self = this;
        var $curEl = this.$el;
        var $valuesContainer = checked ? $curEl.find('.ulContent.checked') : $curEl.find('.ulContent:not(.checked)');
        var $ulElement = $valuesContainer.find('.filterValues');
        var $paginationLi = $valuesContainer.find('.miniStylePagination');
        var displayCollection;
        var start;
        var end;
        var collectionLength = collection.length;
        var currentPage = checked ? this.currentCheckedPage : this.currentPage;
        var elementsToShow = this.optionsElementToShow || (FILTERSCONSTANTS.FILTER_VALUES_COUNT > collectionLength) ? collectionLength : FILTERSCONSTANTS.FILTER_VALUES_COUNT;

        options = options || {};

        start = (currentPage - 1) * elementsToShow;
        end = Math.min(currentPage * elementsToShow, collection.length);

        if (start === end) {
            start = end - elementsToShow;
        }

        displayCollection = collection.slice(start, end);

        var collectionsLength = this.checkedCollection.length + this.uncheckedCollection.length;

        if (!collectionsLength && checked) {
            $ulElement.html('');
            $ulElement.html(filtersEmptySearchResultTemplate);
        } else if (!collectionsLength && !checked) {
            $ulElement.html('');
        } else if (collectionsLength) {
            $ulElement.html(self.elementsTemplate({
                collection: displayCollection
            }));
        }

        this.makePagination($paginationLi, {
            start           : start,
            end             : end,
            collectionLength: collectionLength,
            currentPage     : currentPage,
            elementsToShow  : elementsToShow,
            checked         : checked
        });

        if (!options.notHideValues) {
            $valuesContainer.hide();
        }
    },

    setPlaceHolder: function () {
        var $curEl = this.$el;
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
            Cookies.get('currentLanguage') || 'en';

        $curEl
            .find('.filterName input')
            .attr('placeholder', this.filterDisplayName[currentLanguage] || this.filterDisplayName);
    },

    render: function () {
        var self = this;
        var $currentEl = this.$el;
        var $nameInput;
        var filterInputText = this.currentFilter && !this.currentFilter.options && this.currentFilter.names.join(', ') || '';
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
            Cookies.get('currentLanguage') || 'en';

        $currentEl.append(this.template({
            filterDisplayName: this.filterDisplayName[currentLanguage] || this.filterDisplayName,
            filterName       : this.filterName,
            mandatory        : this.mandatory,
            currentFilter    : this.currentFilter && !this.currentFilter.options ? this.currentFilter : null,
            filterInputText  : filterInputText,
            translation      : this.translation,
            showSelectAll    : this.filerConstants.showSelectAll
        }));

        this.beforeRenderContent({
            withEmptyResult : false
        });

        $currentEl.find('.' + this.filterName + 'Values .miniStylePagination a').click(function (e) {
            self.paginationChange(e, self);
        });

        $nameInput = $currentEl.find('.filterName > input');

        $nameInput.on('focusin', function (e) {
            var $target = $(e.currentTarget);
            var val = $target.val();

            $target.data('data-prevVal', val);
            self.updateNames = false;

            $target.val('');
        });

        $nameInput.on('focusout', function (e) {
            var $target = $(e.currentTarget);
            var val = $target.data();

            $target.val(val.dataPrevVal);
            $target.removeData('data-prevVal');

            self.updateNames = true;
            if (!self.filteredCollection.length) {
                $target.val('');
                self.inputEvent(e);
            }
        });

        $nameInput.on('input', function (e) {
            self.inputEvent(e);
        });

        $nameInput.click(function (e) {
            var target = $(e.target);

            if (!target.hasClass('dropDown')) {
                return false;
            }
        });
    }
});

filterValuesView.extend = function (childTopBar) {
    var view = Backbone.View.extend.apply(this, arguments);

    view.prototype.events = _.extend({}, this.prototype.events, childTopBar.events);

    return view;
};
