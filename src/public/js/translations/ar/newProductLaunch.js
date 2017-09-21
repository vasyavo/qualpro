var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var newProductLaunch = {
    // list
    productCategory: ' إطلاق منتج جديد ',
    variant        : "النوع",
    packaging      : 'التغليف ',
    location       : 'الموقع ',
    fromTo         : 'من:الى ',
    // preview
    all            : ' إطلاق منتج جديد ',
    saveBtn        : 'موافق ',
    category       : 'الفئة ',
    brand          : 'المنافس ',

    employee     : 'الموظف ',
    country      : 'الدولة ',
    region       : 'المنطقة ',
    subRegion    : 'المنطقة الفرعية ',
    retailSegment: 'الفئة التجارية ',
    outlet       : 'العميل ',
    branch       : 'الفرع ',
    attachments  : 'الملفات المرفقة ',
    comment      : 'التعليق ',
    origin       : 'بلد المنشأ ',
    packing      : 'التغليف ',
    price        : 'سعر البيع للمستهلك ',
    displayType  : 'نوع العرض ',
    distributor  : 'الموزع ',
    shelfLife    : 'تاريخ الانتاج / تاريخ الانتهاء',
    startDate : '', // todo
    endDate : '', // todo

    goToBtn : '', // todo
    edit         : 'تعديل بيانات',
    delete: '', // todo
    newProductLaunchEditTitle : '', // todo
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, newProductLaunch);
