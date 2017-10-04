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
    edit         : 'تعديل بيانات',
    delete       : 'حذف',
    saveBtn      : 'حفظ',

    // edit
    competitorBrandingEditTitle: 'تعديل بيانات  العلامات التجارية وتقارير العرض للمنافسين',

    // topBar
    all        : ' العلامات التجارية وتقارير العرض للمنافسين',
    okBtn      : 'موافق',
    dialogTitle: ' التعليقات والمرفقات',
    goToBtn    : 'الذهاب الى',
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
