var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    competitorPromotionEditTitle : 'تعديل بيانات  ترويج المنافسين',
    all         : ' أنشطة ترويج المنافسين',
    title       : 'تقرير تقيم أنشطة ترويج المنافسين',
    category    : 'الفئة',
    brand       : 'المنافس',
    origin      : 'بلد المنشأ',
    promotion   : 'منتج الترويج',
    rsp         : 'سعر البيع للمستهلك',
    packing     : 'التغليف',
    expiry      : 'تاريخ الانتهاء',
    employee    : 'الموظف',
    country     : 'الدولة',
    region      : 'المنطقة',
    subRegion   : 'المنطقة الفرعية',
    tradeChannel: 'الفئة التجارية',
    outlet      : 'العميل',
    branch      : 'الفرع',
    displayType : 'نوع العرض',
    startDate   : 'تاريخ البدء',
    endDate     : 'تاريخ الانتهاء',
    description : 'الوصف',
    attachments : 'الملفات المرفقة',
    files       : 'الملفات',
    attach      : 'ارفاق',
    send        : 'ارسال',
    saveBtn     : 'حفظ',
    location    : 'الموقع',
    okBtn       : 'موافق',
    edit     : 'تعديل بيانات',
    delete      : 'حذف',
    dialogTitle : ' التعليقات والمرفقات',
    goToBtn     :  'الذهاب الى',
    weight      : 'التغليف',
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
