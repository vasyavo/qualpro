var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var cropImagesTranslation = require('./cropImages');

var translation = {
    crop           : cropImagesTranslation,
    name           : 'الاسم',
    country        : 'الدولة',
    barcode        : ' الباركود',
    ppt            : ' سعر البيع للتاجر',
    origin         : 'بلد المنشأ',
    manageCat      : 'إدارة الفئات، المنوعات والسلع',
    listedItems    : ' السلع المدرجة',
    all            : ' السلع والأسعار',
    itemsToCustomer: 'اضافة السلع للعملاء',
    manageItem     : 'إدارة السلع والأسعار',
    action         : ' اتخاذ إجراء',
    disable        : ' إلغاء تفعيل',
    unDisable      : ' إعادة تفعيل',
    packing        : 'التغليف',
    product        : 'المنتج',
    archive        : ' الأرشيف',
    retailSegment  : 'قطاع التجزئة',
    outlet         : 'العميل',
    okBtn          : 'موافق',
    cancelBtn      : 'إلغاء',
    saveBtn        : 'موافق',
    createItems    : 'إنشاء السلع',
    closeBtn       : 'إغلاق',
    category       : 'الفئة',
    item           : 'السلعة: ',
    variant        : 'النوع',
    englishName    : 'الاسم باللغة الانكليزية',
    arabicName     : 'الاسم باللغة بالعربية'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
