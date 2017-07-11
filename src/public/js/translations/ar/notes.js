var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var notesTranslation = {
    // top bar
    all      : 'الملاحظات',
    archive  : 'الأرشيف',
    newNote  : 'ملاحظة جديدة',
    selectAll: 'اختيار الكل',
    action   : 'اتخاذ إجراء',
    disable  : 'إلغاء تفعيل',
    unDisable: 'إعادة تفعيل',
    // list

    // create
    createTitle: 'إنشاء ملاحظة',
    title      : 'عنوان نص الملاحظة الجديدة',
    theme      : 'موضوع',
    createBtn  : 'إنشاء',
    cancelBtn  : 'إلغاء',

    // edit
    editTitle   : 'تعديل الملاحظة',
    saveBtn     : 'حفظ',
    // preview
    okBtn       : 'موافق',
    preViewTitle: 'عرض الملاحظة',
    description : 'الوصف',
    titleOnly   : 'عنوان النص',
    goToBtn     : 'الذهاب الى'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, notesTranslation);
