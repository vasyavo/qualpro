var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    // list view
    title: 'العنوان',
    type: 'متعلق ب',
    resolved : 'تم حل الطلب',

    // preview
    employeeName : 'اسم الموظف',
    country : 'الدولة',
    dateCreated  : 'تاريخ الإنشاء',
    status : 'حالة الطلب',
    titlePreview : 'اتصل بنا',
    description  : 'الوصف',
    attachments  : 'المرفقات',
    files        : 'الملفات',
    noTranslation: 'لا يوجد ترجمة',
    resolveBtn : 'حل الطلب',
    comments : 'التعليقات',
    attachmentsDialogTitle : 'الملفات الخاصة بخاصية اتصل بنا',

    // topBar
    all        : 'اتصل بنا',
    okBtn      : 'موافق',
    sendBtn    : 'ارسال',
    attachBtn    : 'ارفاق'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
