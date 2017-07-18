var $ = require('jquery');
var _ = require('underscore');
var moment = require('moment');
var FilterView = require('../../views/filter/filterView');
var valuesTemplate = require('../../../templates/filter/filterTemplate.html');
var filterCollection = require('../../collections/filter/filterCollection');
var App = require('../../appState');

module.exports = FilterView.extend({
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
        this.selectedOtherValues(checkElement, options);
    }
});
