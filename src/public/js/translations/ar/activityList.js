var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    // list
    activity: 'النشاط',
    location: 'الموقع',
    user: 'المستخدم',
    date: 'التاريخ',
    all: 'قائمة الأنشطة',
    period: 'الفترة؛',
    from: 'من؛',
    to: 'إلى؛',
    ok: 'موافق'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
