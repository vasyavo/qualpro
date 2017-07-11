var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    // list
    activity: 'Activity',
    location: 'Location',
    user    : 'User',
    date    : 'Date',
    all     : 'Activity List'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
