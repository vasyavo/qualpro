var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var brandingAndDisplayTranslation = {
    // top bar
    all                : ' العلامات التجارية وتقارير العرض الخاصة بالعلالي ',
    newBranding        : 'نشاط تسويقي جديد',
    // list
    startDate          : ' تاريخ البدء: ',
    endDate            : ' تاريخ الانتهاء: ',
    location           : ' الموقع: ',
    item               : 'السلعة: ',
    promotionType      : 'تفاصيل الترويج: ',
    // tableي
    brandingItemsTable : 'جدول العلامات التجارية وتقارير العرض للسلع',
    employee           : 'الموظف',
    comment            : 'التعليق',
    // create
    createTitle        : 'انشاء نشاط تسويقي جديد',
    publishBtn         : 'نشر',
    cancelBtn          : ' إلغاء',
    attachments        : 'الملفات المرفقة',
    attachFiles        : ' إرفاق ملفات',
    description        : 'الوصف',
    selectTitle        : ' اختر عنوان النص',
    selectCountry      : 'اختر الدولة',
    selectCategory     : 'اختر الفئة',
    selectRegion       : 'اختر المنطقة',
    selectSubRegion    : 'اختر المنطقة الفرعية',
    selectRetailSegment: 'اختر الفئة التجارية',
    selectOutlet       : 'اختر العميل',
    selectBranch       : 'اختر الفرع',
    // edit
    saveBtn            : 'حفظ',
    duplicateBranding  : 'تكرار إنشاء النشاط التسويقي',
    editBranding       : 'تعديل بيانات النشاط التسويقي',
    edit               : 'تعديل البيانات',
    duplicate          : 'تكرار ',

    // preview
    okBtn         : 'موافق',
    preViewTitle  : 'عرض بيانات النشاط التسويقي',
    table         : 'الجدول',
    editBtn       : 'تعديل',
    duplicateBtn  : 'تكرار',
    brand         : 'العلالي',
    category      : 'الفئة',
    displayType   : 'نوع العرض: ',
    country       : 'الدولة',
    region        : 'المنطقة:',
    subRegion     : 'المنطقة الفرعية:',
    retailSegment : 'الفئة التجارية:',
    outlet        : 'العميل',
    branch        : 'الفرع',
    addTranslation: {
        en: 'إضافة الترجمة العربية',
        ar: 'إضافة الترجمة الانجليزية'
    },

    attachButtonName: 'ارفاق',
    send            : 'ارسال',
    attach          : 'ارفاق',
    dialogTitle     : ' ملفات العلامات التجارية وتقارير العرض ',
    viewDetails     : ' عرض البيانات',
    comments        : ' التعليقات',
    commentText     : 'التعليق',
    goToBtn         : 'الذهاب الى'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, brandingAndDisplayTranslation);
