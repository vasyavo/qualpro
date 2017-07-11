var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var shelfSharesTranslation = {
    // body
    max: 'الحد الاقصى',
    mid: 'متوسط',
    min: 'الحد الادنى',

    // header
    total: 'العدد الإجمالي 100٪',
    brand: 'المنافس',

    //list
    product: 'المنتج',

    //preview
    timeStamp: 'وقت الدخول',
    branch   : 'الفرع',
    value    : 'القيمة',
    employee : 'الموظف',
    options  : 'الخيارات',
    saveBtn       : 'حفظ',

    //top Bar
    all: ' حصة الرف'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, shelfSharesTranslation);
