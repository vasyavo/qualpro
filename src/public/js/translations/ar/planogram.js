var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    all                 : 'طريقة العرض',
    archive             : 'الأرشيف',
    manageConfigurations: 'إدارة ابعاد واحجام التكوين',
    manageConfiguration : 'إدارة ابعاد واحجام التكوين',
    newPlanogram        : 'طريقة عرض جديدة',
    selectAll           : 'اختيار الكل',
    action              : 'اتخاذ إجراء',
    disable             : 'إلغاء تفعيل',
    unDisable           : 'إعادة تفعيل',
    saveBtn             : 'حفظ',
    cancelBtn           : 'إلغاء',
    okBtn               : 'موافق',
    goToBtn             : 'الذهاب الى',
    editBtn             : 'تعديل',
    displayType         : 'نوع العرض',
    manage              : 'إدارة',
    productsInformation : 'معلومات المنتجات',
    manageProductsInformation: 'إدارة معلومات المنتجات',

    // list
    // create
    createPlanogram: 'إنشاء طريقة عرض',
    addPhoto       : 'إضافة صورة',
    // edit
    editPlanogram  : 'تعديل طريقة العرض',
    changePhoto    : 'تغيير الصورة',
    country        : 'الدولة',
    tradeChannel   : 'قطاع التجزئة',
    product        : 'المنتج',
    configuration  : 'أبعاد واحجام التكوين',
    // preview
    viewPlanogram  : 'عرض طريقة العرض',
    configurations : 'أبعاد واحجام التكوين',
    close          : 'إغلاق'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
