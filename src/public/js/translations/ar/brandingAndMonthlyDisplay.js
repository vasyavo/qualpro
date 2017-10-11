var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    // list view
    brand      : 'المنافس',
    category   : 'الفئة',
    displayType: 'نوع العرض',

    startDate: 'تاريخ البدء',
    endDate  : 'تاريخ الانتهاء',
    location : 'الموقع',

    // preview
    titlePreview : 'عرض بيانات النشاط التسويقي',
    country      : 'الدولة',
    region       : 'المنطقة',
    subRegion    : 'المنطقة الفرعية',
    retailSegment: 'الفئة التجارية',
    outlet       : 'العميل',
    branch       : 'الفرع',
    description  : 'الوصف',
    attachments  : 'الملفات المرفقة',
    files        : 'الملفات',
    attachBtn    : 'ارفاق',
    sendBtn      : 'ارسال',
    noTranslation: ' لا يوجد ترجمة ',
    skipped      : 'تخطي',
    commentText  : 'التعليق',
    missedData   : 'البيانات المفقودة',
    edit         : 'تعديل بيانات',
    delete: 'حذف',

    // edit
    saveBtn: 'حفظ',
    brandingAndMonthlyDisplayEditTitle: 'تعديل العلامات التجارية وتقارير العرض',

    // topBar
    all: 'العلامات التجارية وتقارير العرض الشهرية الخاصة بالعلالى',
    okBtn: 'موافق',
    dialogTitle: ' التعليقات والمرفقات',
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
