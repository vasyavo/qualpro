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
    all            : 'العملاء',
    archive        : 'الارشيف',
    firstBreadCrumb: 'الدول',
    newDomain      : 'فرع جديد',
    selectAll      : 'اختيار الكل',
    newButton      : 'عميل جديد',
    okBtn          : 'موافق',
    // list
    flag           : 'العلم',
    name           : 'الاسم',
    createdBy      : 'تم إنشاؤه بواسطة',
    // create
    createTitle    : 'إنشاء عميل',
    labelName      : 'اسم العميل',
    addImage       : 'إضافة صورة',
    addTranslation : {
        en: 'إضافة الترجمة العربية',
        ar: 'إضافة الترجمة الانجليزية'
    },

    createBtn   : 'إنشاء',
    cancelBtn   : 'إلغاء',
    // edit
    editTitle   : 'تعديل العميل',
    changeImage : 'تغيير الصورة',
    saveBtn     : 'حفظ',
    // preview
    previewTitle: 'عرض العميل',
    domainName  : 'العميل'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, retailSegmentTranslation, actionTranslation);
