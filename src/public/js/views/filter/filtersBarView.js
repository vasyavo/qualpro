define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/filter/multiSelectFilterView',
    'views/filter/singleSelectFilterView',
    'views/filter/timeFilterView',
    'views/filter/translatedFilterView',
    'text!templates/filter/filterContainer.html',
    'collections/filter/filterCollection',
    'custom',
    'common',
    'constants/contentType',
    'constants/filters',
    'dataService',
    'js-cookie'
], function (Backbone, $, _,
             MultiSelectFilterView, SingleSelectFilterView, TimeFilterView, TranslatedFilterView,
             FilterContainerTemplate, filterValuesCollection,
             Custom, Common, CONSTANTS, FILTERSCONSTANTS,
             dataService) {
    var FilterView = Backbone.View.extend({
        contentType            : 'filter',
        filterContainerTemplate: _.template(FilterContainerTemplate),
        domainsArray           : [CONSTANTS.COUNTRY, CONSTANTS.REGION, CONSTANTS.SUBREGION, CONSTANTS.RETAILSEGMENT, CONSTANTS.OUTLET, CONSTANTS.BRANCH],
        MultiSelectFilterView  : MultiSelectFilterView,
        SingleSelectFilterView : SingleSelectFilterView,
        TimeFilterView         : TimeFilterView,
        TranslatedFilterView   : TranslatedFilterView,
        mandatoryObject        : {},
        mandatoryCount         : 0,
        useFilterEventState    : true,

        events: {
            'click .clearBtn': 'clearMethod'
        },

        initialize: function (options) {
            var self = this;

            this.translation = options.translation;
            this.dialog = options.dialog || false;
            this.defFilter = options.defFilter || {};
            this.parentContentType = options.contentType || '';
            this.constantsObject = FILTERSCONSTANTS.FILTERS[this.parentContentType];
            this.translatedCollection = FILTERSCONSTANTS.TRANSLATED_COLLECTION;
            this.timeCollection = FILTERSCONSTANTS.TIME_COLLECTION;
            this.ratedCollection = FILTERSCONSTANTS.RATED_COLLECTION;
            this.filterViews = {};
            this.filter = options.filter || {};
            this.personnelToOnLeave = options.personnelToOnLeave;
            this.notCheckFilters = options.notCheckFilters;
            this.parseFilter();
            this.setMandatoryObject();

            _.bindAll(this, 'selectValue');

            this.on('tabsChanged', this.tabsChanged, this);

            this.useFilterEvent = _.debounce(
                function () {
                    var filter = $.extend({}, self.filter, self.defFilter);

                    self.trigger('filter', filter);
                }, 500);

            this.globalSearchEvent = _.debounce(
                function (e) {
                    var target = e.target;
                    var value = target.value;

                    if (!self.filter) {
                        self.filter = {};
                    }

                    if (self.personnelToOnLeave) {
                        self.filter = _.extend(self.filter, {
                            onLeaveId: self.personnelToOnLeave.id
                        });
                    }

                    self.filter.globalSearch = value;
                    self.useFilterEvent();

                }, 1000);

            this.searchInput = this.$el.closest('.filterBar').find('#searchInput' + this.parentContentType);
            this.searchInput.on('input', function (e) {
                self.globalSearchEvent(e);
            });
        },

        changeTranslatedFields: function () {
            var self = this;
            var filterViewsKeys = Object.keys(this.filterViews);

            filterViewsKeys.forEach(function (key) {
                self.filterViews[key].setPlaceHolder();
            });
        },

        setMandatoryObject: function () {
            var self = this;
            var filterNames = this.constantsObject.array;

            self.mandatoryObject = {};

            filterNames.forEach(function (name) {
                if (self.constantsObject[name].mandatory) {
                    self.mandatoryObject[name] = false;
                }
            });

            this.mandatoryCount = Object.keys(this.mandatoryObject).length;
        },

        getCheckedMandatoryCount: function () {
            return _.compact(_.values(this.mandatoryObject)).length;
        },

        changeLanguage: function () {
            var filterKeys = _.keys(this.filterViews);
            var self = this;

            filterKeys.forEach(function (filterKey) {
                self.filterViews[filterKey].beforeRenderContent();
                self.filterViews[filterKey].reRenderInput();
            });

        },

        getFilterKeys: function (filter) {
            var filterNames;

            filter = filter || this.filter;

            if (this.domainsArray.indexOf(this.parentContentType) === -1) {
                filterNames = _.without(_.keys(filter), 'archived', 'parent', 'subRegions', 'retailSegments', 'fromTime', 'toTime', '$or', '$and', '$nor', 'globalSearch', 'assignedTo', 'createdBy.user', 'cover') || [];
            } else {
                filterNames = _.without(_.keys(filter), 'archived', 'parent', 'subRegions', 'retailSegments', 'fromTime', 'toTime', '$or', '$and', '$nor', 'globalSearch', 'assignedTo', 'createdBy.user', 'cover', CONSTANTS.SUBREGION, CONSTANTS.RETAILSEGMENT, CONSTANTS.OUTLET) || [];
            }

            filterNames.forEach(function (name, index) {
                if (filter[name].options) {
                    filterNames.splice(index, 1);
                }
            });

            return filterNames;

        },

        clearMethod: function (e, notReloadFilters) {
            this.filter = $.extend({}, this.defFilter);
            this.searchInput.val('');

            if (!notReloadFilters) {
                this.setMandatoryObject();
                this.reloadFilters();
            }

            App.storage.remove('currentCheckedFilter');
        },

        tabsChanged: function (defFilter) {
            this.defFilter = defFilter;
            this.setDefaultFilters();
            this.useFilterEventState = false;
            this.clearMethod();
        },

        clearFiltersBelow: function (options) {
            var filterKeys = this.getFilterKeys();
            var filterTypes = this.constantsObject.array;
            var self = this;

            filterKeys.forEach(function (key) {
                var $filterElement = self.$el.find('.' + key + 'FilterContainer .filterName');

                if (filterTypes.indexOf(key) > filterTypes.indexOf(options.filterName) && !self.constantsObject[key].mandatory && ( !self.defFilter[key] || (self.defFilter[key] && self.defFilter[key].options) )) {
                    delete self.filter[key];

                    self.filterViews[key].currentFilter = null;

                    if (key === 'time') {
                        delete self.filter.fromTime;
                        delete self.filter.toTime;
                    }

                    $filterElement.removeClass('checkedGroup').find('input').val('');
                }
            });
        },

        selectValue: function (options) {
            var values = this.filter[options.filterName] ? this.filter[options.filterName].values : [];

            if (options.mandatory && options.checkElement) {
                this.mandatoryObject[options.filterName] = true;
            } else if (options.mandatory && !options.notUpdateMandatory && !values.length) {
                this.mandatoryObject[options.filterName] = false;
            }
        },

        reloadFilters: function (selectedFilterName) {
            var keys = this.constantsObject.array;
            var unlockFilters;
            var self = this;
            var currentCheckedFilter = App.storage.find('currentCheckedFilter');

            if (this.domainsArray.indexOf(this.parentContentType) === -1 || (!selectedFilterName && this.domainsArray.indexOf(this.parentContentType) === -1)) {
                dataService.getData('/filters/' + this.parentContentType, {
                    filter : this.filter,
                    current: currentCheckedFilter
                }, function (err, result) {
                    if (err) {
                        return App.render({type: 'error', message: err.message});
                    }

                    App.filterCollections[self.parentContentType] = result;

                    if (self.parentContentType === CONSTANTS.PERSONNELTASKS && keys.indexOf('time') !== -1) {
                        var timePosition = keys.indexOf('time');
                        if (timePosition !== -1) {
                            keys.splice(timePosition, 1);
                        }
                    }
                    self.getValuesCollection(keys, selectedFilterName);

                    if (self.useFilterEventState) {
                        self.useFilterEvent();
                    }

                    unlockFilters = self.getCheckedMandatoryCount() === self.mandatoryCount;

                    if (!unlockFilters) {
                        self.$el
                            .find('.filterName:not(".mandatory")')
                            .closest('.filterFullContainer')
                            .addClass('filterBlocked');
                    } else {
                        self.$el
                            .find('.filterName:not(".mandatory")')
                            .closest('.filterFullContainer')
                            .removeClass('filterBlocked');
                    }

                    self.useFilterEventState = true;
                });
            } else {
                self.getValuesCollection(keys, selectedFilterName);

                if (self.useFilterEventState) {
                    self.useFilterEvent();
                }

                unlockFilters = self.getCheckedMandatoryCount() === self.mandatoryCount;

                if (!unlockFilters) {
                    self.$el
                        .find('.filterName:not(".mandatory")')
                        .closest('.filterFullContainer')
                        .addClass('filterBlocked');
                } else {
                    self.$el
                        .find('.filterName:not(".mandatory")')
                        .closest('.filterFullContainer')
                        .removeClass('filterBlocked');
                }

                self.useFilterEventState = true;
            }
        },

        setDefaultFilters: function () {
            var self = this;

            this.constantsObject.array.forEach(function (constantsFilterName) {
                if (self.defFilter[constantsFilterName] && !self.defFilter[constantsFilterName].options) {
                    self.defFilter[constantsFilterName].values.forEach(function (value, index) {
                        self.filtersCollections[constantsFilterName].reset([{
                            _id   : self.defFilter[constantsFilterName].values[index],
                            name  : {
                                ar: self.defFilter[constantsFilterName].names[index],
                                en: self.defFilter[constantsFilterName].names[index]
                            },
                            status: true
                        }], {silent: true});
                    });
                }
            });
        },

        getValuesCollection: function (filterNames) {
            var valuesCollection = {};
            var self = this;
            var filterConstants = FILTERSCONSTANTS.FILTERS[this.parentContentType] || {};

            var userLevel = App.currentUser.accessRole.level;

            var checkIfOneByRoles = {
                0: [],
                1: [],
                2: ['country'],
                3: ['country', 'region'],
                4: ['country', 'region', 'subRegion'],
                8: [],
                9: ['country']
            };

            function cloneArrayOfObjects(array) {
                var clonedArray = _.map(array, function (element) {
                    return _.extend({}, element);
                });

                return clonedArray;
            }

            filterNames.forEach(function (filterName) {
                var collection;
                var checkedValues = self.filter[filterName] && !self.filter[filterName].options ? self.filter[filterName].values : [];
                var checkedId;

                switch (filterName) {
                    case 'translated':
                        collection = cloneArrayOfObjects(self.translatedCollection);
                        break;
                    case 'time':
                        collection = cloneArrayOfObjects(self.timeCollection);
                        break;
                    case 'lasMonthEvaluate':
                        collection = cloneArrayOfObjects(self.ratedCollection);
                        break;
                    default:
                        /*if (selectedKey && filterName === selectedKey && checkedValues.length) {
                         collection = self.filtersCollections[filterName].toJSON();
                         } else {*/
                        collection = _.compact(App.filterCollections[self.parentContentType][filterName]);
                        /*}*/
                        break;
                }

                if (checkedValues.length) {
                    collection = _.map(collection, function (model) {
                        model.status = checkedValues.indexOf(model._id) !== -1;

                        return model;
                    });

                    if (filterConstants[filterName].mandatory) {
                        self.selectValue({
                            filterName  : filterName,
                            checkElement: true,
                            mandatory   : true
                        });
                    }
                } else if (collection.length === 1 && checkIfOneByRoles[userLevel].indexOf(filterName) !== -1 && !self.notCheckFilters) {
                    if (!self.filter[filterName]) {
                        self.filter[filterName] = {
                            type  : filterConstants[filterName].type,
                            values: [],
                            names : []
                        };
                    }

                    collection[0].status = true;
                    checkedId = collection[0]._id;
                    self.filter[filterName].values = [checkedId];

                    if (filterConstants[filterName].mandatory) {
                        self.selectValue({
                            filterName  : filterName,
                            checkElement: true,
                            mandatory   : true
                        });
                    }
                }

                if (!self.filtersCollections || !self.filtersCollections[filterName]) {

                    valuesCollection[filterName] = new filterValuesCollection(collection, {parse: true});

                    if (checkedId) {
                        self.filter[filterName].names = [valuesCollection[filterName].get(checkedId).get('name').currentLanguage];
                    }
                } else {

                    self.filterViews[filterName].filter = self.filter;
                    self.filtersCollections[filterName].reset(collection, {parse: true});

                    if (checkedId) {
                        self.filter[filterName].names = [self.filtersCollections[filterName].get(checkedId).get('name').currentLanguage];
                    }
                }

            });

            return valuesCollection;
        },

        removeAll: function () {
            var keys = _.keys(this.filterViews);
            var self = this;

            keys.forEach(function (viewName) {
                self.filterViews[viewName].remove();
            });

            self.undelegateEvents();
            self.remove();
        },

        renderFilter: function (options) {
            var saveObj = {
                filterName      : options.filterName,
                filterKeys      : options.filterKeys,
                filerConstants  : options.filerConstants,
                valuesCollection: options.valuesCollection,
                filterBlocked   : !options.filerConstants.mandatory
            };

            var currentFilter = this.filter[saveObj.filterName];
            var container;

            this.$el.prepend(this.filterContainerTemplate({
                filterContainerClass: saveObj.filterName + 'FilterContainer',
                filterBlocked       : saveObj.filterBlocked
            }));

            container = this.$el.find('.' + saveObj.filterName + 'FilterContainer');

            this.filterViews[saveObj.filterName] = new this[saveObj.filerConstants.filterType.capitalizer('firstCaps') + 'FilterView']({
                el              : container,
                valuesCollection: saveObj.valuesCollection,
                currentFilter   : currentFilter,
                contentType     : this.parentContentType,
                filter          : this.filter,
                filterBarView   : this,
                defFilter       : this.defFilter,
                filterName      : saveObj.filterName,
                filerConstants  : saveObj.filerConstants,
                translation     : this.translation,
                showSelectAll   : saveObj.filerConstants.showSelectAll
            });

            this.filterViews[saveObj.filterName].on('selectValue', this.selectValue, this);
            this.filterViews[saveObj.filterName].on('reloadFilters', this.reloadFilters, this);
            /*this.filterViews[saveObj.filterName].on('incMandatoryCheckedCount', function () {
             this.mandatoryCheckedCount++;
             }, this);*/

            this.filterViews[saveObj.filterName].render();
        },

        render: function () {
            var filterNames = _.clone(this.constantsObject.array).reverse();
            var filterKeys = this.getFilterKeys();
            var filterBlocked;
            var self = this;
            var unlockFilters;

            this.filtersCollections = this.getValuesCollection(filterNames);
            this.setDefaultFilters();

            if (this.filter && this.filter.globalSearch) {
                this.searchInput.val(this.filter.globalSearch);
            }

            filterNames.forEach(function (filterName) {
                self.renderFilter({
                    filterName      : filterName,
                    filterKeys      : filterKeys,
                    valuesCollection: self.filtersCollections[filterName],
                    filerConstants  : self.constantsObject[filterName]
                });
            });

            unlockFilters = this.getCheckedMandatoryCount() === this.mandatoryCount;

            if (!unlockFilters) {
                this.$el
                    .find('.filterName:not(".mandatory")')
                    .closest('.filterFullContainer')
                    .addClass('filterBlocked');
            } else {
                this.$el
                    .find('.filterName:not(".mandatory")')
                    .closest('.filterFullContainer')
                    .removeClass('filterBlocked');
            }

            return this;
        },

        parseFilter: function () {
            var browserString = window.location.hash;
            var browserFilter = browserString.split('/filter=')[1];

            if (!this.dialog) {
                // this.filter = browserFilter ? JSON.parse(_.unescape(browserFilter)) : {};
                this.filter = browserFilter ? JSON.parse(decodeURIComponent(browserFilter)) : {};
            }
        }
    });

    return FilterView;
});
