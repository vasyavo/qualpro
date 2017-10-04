var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var priceSurveyTranslation = {
    // body
    max: 'الاقصى',
    mid: ' منتصف',
    min: 'الأدنى',
    avg: ' متوسط ',
    median: 'متوسط السعر',

    // header
    total   : 'المجموع الكلى',
    brand   : 'المنافس',
    variants: 'المنوع',
    size    : 'الحجم',
    origin  : 'بلد المنشأ',
    gms     : '(كلغ.)',

    // list
    product : 'المننج',
    category: 'الفئة',

    // preview
    timeStamp: 'وقت الدخول',
    branch   : 'الفرع',
    value    : 'القيمة',
    employee : 'الموظف',
    options  : 'الخيارات',
    okBtn: 'موافق',
    saveBtn       : 'حفظ',
    delete: 'حذف',
    edit: 'تعديل',

    // topBar
    all: ' الدراسة الاستقصائية للأسعار'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, priceSurveyTranslation);
