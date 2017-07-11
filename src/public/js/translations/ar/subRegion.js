var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var cropImagesTranslation = require('./cropImages');

var subRegionTranslation = {
    crop           : cropImagesTranslation,
    // top bar
    all            : 'المنطقة الفرعية',
    archive        : 'الأرشيف',
    firstBreadCrumb: 'الدول',
    newDomain      : 'منطقة فرعية جديدة',
    // list
    flag           : 'العلم',
    name           : 'الاسم',
    createdBy      : 'تم انشائها بواسطة',
    // create
    createTitle    : 'إنشاء منطقة فرعية',
    labelName      : 'الاسم',
    addImage       : 'إضافة صورة',
    addTranslation : {
        en: 'إضافة الترجمة العربية',
        ar: 'إضافة الترجمة الانجليزية'
    },

    createBtn   : 'انشاء',
    cancelBtn   : 'إلغاء',
    // edit
    editTitle   : 'تعديل المنطقة الفرعية',
    changeImage : 'تغيير الصورة',
    saveBtn     : 'حفظ',
    // preview
    previewTitle: 'عرض المنطقة الفرعية',
    domainName  : 'المنطقة الفرعية:'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, subRegionTranslation);
