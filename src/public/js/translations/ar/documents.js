var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var documentsTranslation = {
    // top bar
    all        : 'الوثائق',
    archive    : 'الأرشيف',
    newDocument: 'وثيقة جديدة',
    selectAll  : 'اختيار الكل',
    action     : 'اتخاذ إجراء',
    disable    : ' إلغاء تفعيل',
    unDisable  : 'إعادة تفعيل',
    delete : '', //todo
    copyButton : '',//todo
    cutButton : '',//todo
    pasteButton : '',//todo
    // list

    // create
    createTitle : 'إنشاء وثيقة',
    createFolderTitle : '',//todo
    titleInput  : 'إدخال عنوان النص',
    title       : 'عنوان النص',
    createBtn   : 'إنشاء',
    cancelBtn   : ' إلغاء',
    attachments : 'المرفقات',
    attachFiles : 'إرفاق ملفات',
    // edit
    editTitle   : 'تعديل الوثيقة',
    saveBtn     : 'حفظ',
    // preview
    okBtn       : 'موافق',
    preViewTitle: 'عرض الوثيقة',
    attach      : 'ارفاق',
    documentFile: 'الوثائق والملفات',
    goToBtn     : 'الذهاب الى'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, documentsTranslation);
