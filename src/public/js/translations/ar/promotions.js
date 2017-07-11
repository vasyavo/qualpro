var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var promotionsTranslation = {
    // top bar
    all                : ' تقييم ترويج العلالي',
    newPromotion       : 'ترويج جديد',
    // list
    startDate          : 'تاريخ البدء',
    endDate            : 'تاريخ الانتهاء',
    location           : 'الموقع',
    // table
    promotionItemsTable: 'جدول ترويج السلع',
    actualStartDate    : 'تاريخ البدء الفعلي',
    actualEndDate      : 'تاريخ الانتهاء الفعلي',
    rsp                : 'سعر البيع للمستهلك',
    status             : 'الحالة',
    opening            : 'عدد السلع المتاحة',
    sellIn             : 'عدد السلع المتوقع بيعها',
    clothingStock      : 'عدد السلع المتبقية',
    sellOut            : 'عدد السلع التي تم بيعها',
    comment            : 'التعليق',
    // create
    createTitle        : 'إنشاء ترويج',
    publishBtn         : 'نشر',
    cancelBtn          : 'إلغاء',
    attachments        : 'الملفات المرفقة',
    attachFiles        : 'ارفاق ملفات',
    inputBarcode       : 'إدخال الرمز الشريطي',
    inputPacking       : 'إدخال التغليف',
    inputPpt           : 'ادخال سعر البيع للتاجر',
    inputTotalQuantity : 'إدخال الكمية الاجمالية',
    description        : 'الوصف',
    selectCountry      : 'اختر الدولة',
    selectRegion       : 'اختر المنطقة',
    selectSubRegion    : 'اختر المنطقة الفرعية',
    selectRetailSegment: 'اختر الفئة التجارية',
    selectOutlet       : 'اختر العميل',
    selectBranch       : 'اختر الفرع',
    // edit
    saveBtn            : 'حفظ',
    duplicatePromotion : 'تكرار إنشاء الترويج',
    editPromotion      : 'تعديل بيانات',
    editPromotionItem : '', // todo ar
    // preview
    okBtn              : 'موافق',
    preViewTitle       : 'عرض بيانات الترويج',
    table              : 'الجدول',
    editBtn            : 'تعديل',
    duplicateBtn       : 'تكرار',
    edit               : 'تعديل',
    duplicate          : 'تكرار',
    category           : 'الفئة',
    displayType        : 'نوع العرض',
    country            : 'الدولة',
    region             : 'المنطقة',
    subRegion          : 'المنطقة الفرعية',
    retailSegment      : 'الفئة التجارية',
    outlet             : 'العميل',
    branch             : 'الفرع',
    barcode            : 'الرمز الشريطي',
    packing            : 'التغليف',
    ppt                : 'سعر البيع للتاجر',
    totalQuantity      : 'الكمية الاجمالية',
    promotionType      : 'تفاصيل الترويج',
    addTranslation     : {
        en: 'إضافة الترجمة العربية',
        ar: 'إضافة الترجمة الانجليزية'
    },
    options  : 'الخيارات',

    dialogTitle: 'ملفات الترويج',
    attachBtn  : 'ارفاق',
    goToBtn    : 'الذهاب الى'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, promotionsTranslation);
