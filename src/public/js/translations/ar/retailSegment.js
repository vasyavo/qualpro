var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var branchTranslation = require('./branch');
var cropImagesTranslation = require('./cropImages');
var actionTranslation = require('./action');

var retailSegmentTranslation = {
    crop           : cropImagesTranslation,
    branch         : branchTranslation,
    // top bar
    all            : 'قطاع التجزئة',
    archive        : 'الأرشيف',
    firstBreadCrumb: 'الدول',
    newDomain      : 'فرع جديد',
    selectAll      : 'اختيار الكل',
    newButton      : 'قطاع تجزئة جديد',
    okBtn          : 'موافق',
    // list
    flag           : 'العلم',
    name           : 'الاسم',
    createdBy      : 'تم إنشاؤه بواسطة',
    // create
    createTitle    : 'إنشاء قطاع تجزئة',
    labelName      : 'اسم قطاع التجزئة',
    addImage       : 'إضافة صورة',
    addTranslation : {
        en: 'إضافة الترجمة العربية',
        ar: 'إضافة الترجمة الانجليزية'
    },

    createBtn   : 'إنشاء',
    cancelBtn   : 'إلغاء',
    // edit
    editTitle   : 'تعديل قطاع التجزئة',
    changeImage : 'تغيير الصورة',
    saveBtn     : 'حفظ',
    // preview
    previewTitle: 'عرض قطاع التجزئة',
    domainName  : 'الفئة التجارية:'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, retailSegmentTranslation, actionTranslation);
