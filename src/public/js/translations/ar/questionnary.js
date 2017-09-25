var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    // list
    location: 'الموقع',
    endDate : ' الموعد المحدد',

    // create
    titleQuestionary : ' استطلاع',
    aboutSKUFormat   : 'فيما يتعلق برمز الهوية',
    addNewBtn        : 'أضف سلعة جديدة',
    deleteBtn        : 'حذف السلعة',
    delete           : 'حذف',
    questions        : 'الاسئلة',
    type             : 'نوع الاستطلاع',
    options          : 'خيارات',
    createQuestionary: 'انشاء استطلاع',

    //create Question
    enterQuestion     : {
        en: 'أدخل السؤال في اللغة الإنجليزية',
        ar: 'أدخل السؤال باللغة العربية'
    },
    enterTitle     : {
        en: 'أدخل العنوان باللغة الإنجليزية',
        ar: 'أدخل العنوان باللغة العربية'
    },
    enterOption     : {
        en: 'أدخل الخيار لاختيار باللغة الإنجليزية',
        ar: 'أدخل الخيار للاختيار باللغة العربية'
    },
    title        : 'العنوان',
    dueDate      : 'تاريخ الاستحقاق',
    create       : 'إنشاء',
    questionType : 'نوع السؤال',

    //preview
    titlePreview      : 'استطلاع جديد',
    respondents       : 'المستجيبين',
    duplicateBtn      : 'تكرار',
    editBtn           : 'تعديل',
    respondent        : 'المستجيب',
    answer            : 'الاجابة',
    saveBtn           : 'موافق',
    sendBtn           : 'أرسال',
    goToBtn           : 'الذهاب الى',
    questionaryPreview: 'عرض بيانات الاستطلاع',
    okBtn             : 'موافق',

    //edit answer
    editAnswerViewTitle: 'تعديل اجابة السؤال',

    // top Bar
    all   : 'استطلاع العلالى',
    newBtn: 'جديد',
    of    : 'من'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
