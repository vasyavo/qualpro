var _ = require('underscore');
var filtersTranslation = require('./filters');

module.exports = _.extend({}, {
    of   : 'من',
    items: 'السلع',
    page : 'صفحة',
    next : 'التالي',
    prev : 'السابق'
}, filtersTranslation);
