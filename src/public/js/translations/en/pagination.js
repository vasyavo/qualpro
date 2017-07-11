var _ = require('underscore');
var filtersTranslation = require('./filters');

module.exports = _.extend({}, {
    of   : 'of',
    items: 'items',
    page : 'Page',
    next : 'Next',
    prev : 'Prev'
}, filtersTranslation);
