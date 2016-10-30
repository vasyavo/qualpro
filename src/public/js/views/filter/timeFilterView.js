define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/filter/filterView',
    'views/filter/timeView',
    'text!templates/filter/filterTemplate.html',
    'collections/filter/filterCollection',
    'constants/filters',
    'js-cookie',
    'moment'
], function (Backbone, $, _, FilterView, TimeView, valuesTemplate, filterCollection, FILTERSCONSTANTS, Cookies, moment) {
    var filterValuesView = FilterView.extend({
        template: _.template(valuesTemplate),

        checkFilterElement: function (options) {
            var constantsFilter = this.filerConstants;
            var currentCollection = this.collection;
            var collectionElement;
            var currentFilter;

            options.isCheckedUlContainer = options.$currentElement.closest('.ulContent').hasClass('checked');
            options.currentName = $.trim(options.$currentElement.text());

            this.filter[options.filterName] = {
                type  : constantsFilter.type,
                values: [],
                names : []
            };

            currentFilter = this.filter[options.filterName];
            options.notUpdateMandatory = !!currentFilter.values.length;

            collectionElement = currentCollection.findWhere({_id: options.currentValue});

            currentFilter.names.push(options.currentName);
            currentFilter.values = options.time;

            options.$filterNameElement.addClass('checkedGroup');

            currentCollection.unselectAll();
            collectionElement.set({status: true});

            this.updateFilterNameElement(options, currentFilter.names);
        },

        unCheckFilterElement: function (options) {
            var constantsFilter = this.filerConstants;
            var currentCollection = this.collection;
            var collectionElement;
            var currentFilter;

            options.isCheckedUlContainer = options.$currentElement.closest('.ulContent').hasClass('checked');
            options.currentName = $.trim(options.$currentElement.text());

            this.filter[options.filterName] = this.filter[options.filterName] || {
                    type  : constantsFilter.type,
                    values: [],
                    names : []
                };

            this.currentFilter = this.filter[options.filterName];
            currentFilter = this.currentFilter;

            collectionElement = currentCollection.findWhere({_id: options.currentValue});
            collectionElement.set({status: false});

            currentFilter.names.splice(0, currentFilter.names.length);
            currentFilter.values.splice(0, currentFilter.values.length);

            delete this.filter[options.filterName];
            options.$filterNameElement.removeClass('checkedGroup');

            this.updateFilterNameElement(options, currentFilter.names);
        },

        /*selectedFixedPeriod: function (checkElement, options) {
            var self = this;
            var filterValues;

            if (checkElement) {
                this.timeView = new TimeView(options);
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
                    self.trigger('reloadFilters', App.filterCollections[self.contentType], false, self.filterName);
                });
            } else {
                this.unCheckFilterElement(options);
                this.$el.find('.current').removeClass('current');

                delete this.filter.toTime;
                delete this.filter.fromTime;
                delete this.filter.time;

                this.trigger('reloadFilters', App.filterCollections[this.contentType], false, this.filterName);
            }
        },
*/
        selectedOtherValues: function (checkElement, options) {
            var currentDate = new Date();
            var dateFrom;
            var dateTo;

            if (options.currentValue === 'lastMonth') {
                currentDate = moment(currentDate).subtract(1, 'months');
                dateFrom = moment(currentDate).startOf('month');
                dateTo = moment(currentDate).endOf('month');
            } else if (options.currentValue === 'lastWeek') {
                currentDate = moment(currentDate).startOf('week').weekday(-7);
                dateFrom = moment(currentDate).startOf('week');
                dateTo = moment(currentDate).endOf('week');
            } else if (options.currentValue === 'thisYear') {
                dateFrom = moment(currentDate).startOf('year');
                dateTo = moment(currentDate).endOf('year');
            } else if (options.currentValue === 'thisMonth') {
                dateFrom = moment(currentDate).startOf('month');
                dateTo = moment(currentDate).endOf('month');
            } else if (options.currentValue === 'thisWeek') {
                dateFrom = moment(currentDate).startOf('week');
                dateTo = moment(currentDate).endOf('week');
            }
            options.time = [dateFrom.toString(), dateTo.toString()];

            if (checkElement) {
                this.checkFilterElement(options);
            } else {
                this.unCheckFilterElement(options);
            }

            this.$el.find('.current').removeClass('current');

            this.trigger('selectValue', options);
            this.trigger('reloadFilters', App.filterCollections[this.contentType]);
        },

        selectValue: function (options) {
            var checkElement = options.$currentElement.hasClass('checkedValue');

            /*if (options.currentValue === 'fixedPeriod') {
                this.selectedFixedPeriod(checkElement, options);
            } else {*/
                this.selectedOtherValues(checkElement, options);
            /*}*/
        }
    });

    return filterValuesView;
});
