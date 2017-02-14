'use strict';

const _ = require('lodash');
const moment = require('moment');
const FILTERS_CONSTANTS = require('../public/js/constants/filters');
const CONTENT_TYPES = require('../public/js/constants/contentType');
const filterTypes = {
    ObjectId: ['country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch']
};
const allowedFilters = {
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

const FilterMapper = function () {
    const self = this;

    function ConvertType(array, type, options) {
        const date = new Date();
        let result = {};
        let operator;
        let startDate;
        let endDate;

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
                result[operator] = array.map((item) => {
                    return parseInt(item);
                });
                break;
            case 'string':
                result[operator] = array;
                break;
            case 'emptyArray':
                result[operator] = [];
                break;
            case 'boolean':
                result[operator] = array.map((item) => {
                    return item === 'true';
                });
                break;
            case 'collection':
                result = array.map((filter) => {
                    return self.mapFilter({
                        filter
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
        for (let key in filterTypes) {
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
        const contentType = options.contentType;
        const filter = options.filter || {};
        const context = options.context;
        const personnel = options.personnel;
        const filterObject = {};
        const filtersConstantsObject = contentType ? FILTERS_CONSTANTS.FILTERS[contentType] : null;

        if (personnel) {
            this.setFilterLocation(filter, personnel, 'country', context);
            if (contentType !== CONTENT_TYPES.PERSONNEL && contentType !== CONTENT_TYPES.INSTORETASKS) {
                this.setFilterLocation(filter, personnel, 'region', context);
                this.setFilterLocation(filter, personnel, 'subRegion', context);
            }
        }

        if (context && allowedFilters[context]) {
            for (let filterName in filter) {
                if (filterName !== 'translated') {
                    const filterValues = filter[filterName].values || filter[filterName];
                    const filterType = filter[filterName].type || getType(filterName);
                    const filterOptions = filter[filterName].options || null;

                    if (allowedFilters[context].indexOf(filterName) !== -1 && filterValues.length) {
                        filterObject[filterName] = ConvertType(filterValues, filterType, filterOptions);
                    }
                }
            }
        } else {
            for (let filterName in filter) {
                if (filterName !== 'translated' && filterName !== 'type') {
                    const filterValues = filter[filterName].values || [];
                    const filterType = filter[filterName].type || getType(filterName);
                    const filterOptions = filter[filterName].options || null;
                    const backendKeys = filtersConstantsObject && filtersConstantsObject[filterName] ?
                        filtersConstantsObject[filterName].backendKeys || [] : [];

                    if (backendKeys.length) {
                        if (!filterObject.$or) {
                            filterObject.$or = [];
                        }

                        backendKeys.forEach((keysObject) => {
                            const resObj = {};

                            resObj[keysObject.key] = ConvertType(filterValues, filterType, keysObject.operator);
                            filterObject.$or.push(resObj);
                        });
                    } else {
                        filterObject[filterName] = ConvertType(filterValues, filterType, filterOptions);
                    }
                }
            }
        }

        return filterObject;
    };

    /*
    * Store intersection between set of possible location ID provided in query and assigned to personnel
    * */
    this.setFilterLocation = (filter, personnel, location, context, contentType) => {
        let filterKey = location;

        if (location === context) {
            filterKey = '_id';
        }

        const personnelLocation = personnel[location];

        if (personnelLocation && personnelLocation.length) {
            // convert ObjectId to string
            personnelLocation.forEach((locationId, index) => {
                personnelLocation[index] = locationId.toString();
            });

            const filterValue = filter[filterKey];

            // update location (country, region and sub region) a filter
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
