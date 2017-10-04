var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var cropImagesTranslation = require('./cropImages');

var translation = {
    crop             : cropImagesTranslation,
    name             : 'الاسم',
    cropImages       : ' تحديد جزء من الصورة',
    manageCompetitors: ' إدارة المنافسي',
    brand            : 'المنافس',
    product          : 'المنتج',
    variant          : "النوع",
    origin           : 'بلد المنشأ',
    all              : ' قائمة الشركات المنافسة',
    archive          : ' الأرشيف',
    packing          : 'التغليف',
    country          : 'الدولة',
    closeBtn         : 'إغلاق',
    category         : 'الفئة',
    item             : 'السلعة: ',
    createItems      : 'إنشاء السلع',
    competitorVariant: 'منوع المنافس',
    competitorItem   : 'سلعة المنافس',
    action           : ' اتخاذ إجراء',
    disable          : ' إلغاء تفعيل',
    unDisable        : ' إعادة تفعيل',
    englishName      : 'الاسم باللغة الانكليزية',
    arabicName       : 'الاسم باللغة بالعربية',
    addLogo          : 'إضافة شعار',
    changeLogo       : 'تغيير الاشعار'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
