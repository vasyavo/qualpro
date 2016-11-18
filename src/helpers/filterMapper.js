'use strict';

var _ = require('lodash');
var moment = require('moment');
var FILTERS_CONSTANTS = require('../public/js/constants/filters');
var filterTypes = {
    ObjectId: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
};
var allowedFilters = {
    country         : ['archived', 'parent', 'translated', '_id'],
    region          : ['archived', 'parent', 'translated', '_id'],
    subRegion       : ['archived', 'parent', 'translated', '_id'],
    retailSegment   : ['archived', 'subRegions', 'translated'],
    outlet          : ['archived', 'subRegions', 'retailSegments', 'translated'],
    branch          : ['archived', 'subRegion', 'retailSegment', 'outlet', 'translated'],
    objectivesAssign: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch', 'status', 'position', 'translated', 'lasMonthEvaluate', 'assignLevel']
};
/**
 *  Represents a Filter Mapper constructor.
 *  Allow __You__ post `filter` generated by UI & then retrieve `filterObject` for mongoose.
 * @constructor
 */

var FilterMapper = function () {
    var self = this;

    function ConvertType(array, type, options) {
        var result = {};
        var operator;
        var date = new Date();
        var startDate;
        var endDate;

        if (options && !Array.isArray(options)) {
            if (options.$nin === 'true') {
                operator = '$nin';
            }

            if (options.$eq === 'true') {
                operator = '$eq';
            }
        } else {
            operator = options || '$in';
        }

        switch (type) {
            case 'ObjectId':
                result[operator] = array.objectID();
                break;
            case 'integer':
                result[operator] = _.map(array, function (element) {
                    return parseInt(element);
                });
                break;
            case 'string':
                result[operator] = array;
                break;
            case 'emptyArray':
                result[operator] = [];
                break;
            case 'boolean':
                result[operator] = _.map(array, function (element) {
                    return element === 'true';
                });
                break;
            case 'collection':
                result = _.map(array, function (filter) {
                    return self.mapFilter({
                        filter: filter
                    });
                });
                break;
            case 'rate':
                operator = array && array[0] === 'true' ? '$eq' : '$ne';

                date.setMonth(date.getMonth() - 1);
                result[operator] = (date.getFullYear() * 100 + (date.getMonth() + 1)).toString();

                break;
            case 'date':
                if (array[0]) {
                    startDate = new Date(array[0]);
                    result[operator[0] || operator] = startDate;
                }

                if (array[1]) {
                    endDate = new Date(array[1]);
                    result[operator[1] || operator[0] || operator] = endDate;
                }
                break;

        }

        return result;
    };

    function getType(name) {
        for (var key in filterTypes) {
            if (filterTypes[key].indexOf(name) !== -1) {
                return key;
            }

            return 'string';
        }
    }

    function getFromAndToTime(time) {
        var now = moment();
        var dateFrom;
        var dateTo;

        if (time === 'lastMonth') {
            dateFrom = moment().subtract(2, 'months');
            dateTo = moment().subtract(1, 'months');
        } else if (time === 'lastWeek') {
            dateFrom = moment().subtract(2, 'weeks');
            dateTo = moment().subtract(1, 'weeks');
        } else if (time === 'thisYear') {
            dateFrom = moment().subtract(1, 'years');
            dateTo = now;
        } else if (time === 'thisMonth') {
            dateFrom = moment().subtract(1, 'months');
            dateTo = now;
        } else if (time === 'thisWeek') {
            dateFrom = moment().subtract(1, 'weeks');
            dateTo = now;
        }

        return {
            dateFrom: dateFrom,
            dateTo  : dateTo
        }
    }

    /**
     * @param {Object} filter Filter generated by UI.
     * @param {Object} filter.* Keys are model fields, like `country` or `outlet`.
     * @param {String} filter.*.type Type of filter values.
     * @param {Array} filter.*.values Array of filter values.
     * @return {Object} Returns query object.
     */

    this.mapFilter = function (options) {
        var contentType = options.contentType;
        var filter = options.filter;
        var context = options.context;
        var personnel = options.personnel;
        var filterObject = {};
        var filterValues;
        var filterType;
        var filterName;
        var filterOptions;
        /*
         var haveTimeFilter = filter && (filter.time || filter.fromTime || filter.toTime);
         var fromTime;
         var toTime;
         var timeData;
         */
        var backendKeys = [];
        var filtersConstantsObject = contentType ? FILTERS_CONSTANTS.FILTERS[contentType] : null;

        filter = filter || {};

        if (personnel) {
            this.setFilterLocation(filter, personnel, 'country', context);
            this.setFilterLocation(filter, personnel, 'region', context);
            this.setFilterLocation(filter, personnel, 'subRegion', context);
        }

        if (context && allowedFilters[context]) {
            for (filterName in filter) {
                if (filterName !== 'translated') {

                    filterValues = filter[filterName].values || filter[filterName];
                    filterType = filter[filterName].type || getType(filterName);
                    filterOptions = filter[filterName].options || null;

                    if (allowedFilters[context].indexOf(filterName) !== -1 && filterValues.length) {
                        filterObject[filterName] = ConvertType(filterValues, filterType, filterOptions);
                    }
                }
            }
        } else {
            for (filterName in filter) {
                if (filterName !== 'translated') {
                    filterValues = filter[filterName].values || [];
                    filterType = filter[filterName].type || getType(filterName);
                    filterOptions = filter[filterName].options || null;

                    // if (filterValues && filterValues.length) {
                    backendKeys = filtersConstantsObject && filtersConstantsObject[filterName] ? filtersConstantsObject[filterName].backendKeys || [] : [];

                    if (backendKeys.length) {
                        if (!filterObject.$or) {
                            filterObject.$or = [];
                        }

                        _.map(backendKeys, function (keysObject) {
                            var resObj = {};
                            resObj[keysObject.key] = ConvertType(filterValues, filterType, keysObject.operator);
                            filterObject.$or.push(resObj);
                        });
                    } else {
                        filterObject[filterName] = ConvertType(filterValues, filterType, filterOptions);
                    }

                    // }
                }
            }
        }

        return filterObject;
    };

    this.setFilterLocation = (filter, personnel, location, context) => {
        let filterKey = location;

        if (location === context) {
            filterKey = '_id';
        }

        const personnelLocation = personnel[location];

        if (personnelLocation && personnelLocation.length) {
            personnelLocation.forEach((locationId, index) => {
                personnelLocation[index] = locationId.toString();
            });

            const filterValue = filter[filterKey];

            if (!filterValue || !filterValue.values) {
                filter[filterKey] = {
                    type: 'ObjectId',
                    values: personnelLocation
                };
            } else {
                filterValue.values = _.intersection(filterValue.values, personnelLocation);
            }
        }
    };

};

module.exports = FilterMapper;
