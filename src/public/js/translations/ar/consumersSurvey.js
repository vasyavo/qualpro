define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list
        location: 'الموقع',
        endDate : 'تاريخ الاستحقاق',

        // create
        titleQuestionary : 'استطلاع العملاء',
        aboutSKUFormat   : 'SKU حول',
        addNewBtn        : 'أضف سلعة جديدة',
        deleteBtn        : 'حذف السلعة',
        delete: '', // todo
        questions        : ' استطلاعات',
        type             : ' نوع السؤال',
        options          : 'الخيارات',
        createQuestionary: 'إنشاء استطلاع جديد',

        //create Question
        enterQuestion     : {
            en: 'أدخل السؤال باللغة الإنجليزية',
            ar: 'أدخل السؤال باللغة العربية'
        },
        enterTitle     : {
            en: 'أدخل عنوان الاستطلاع باللغة الانجليزية',
            ar: 'أدخل عنوان الاستطلاع باللغة العربية'
        },
        enterOption     : {
            en: 'أدخل الاجابة باللغة الانجليزية',
            ar: 'أدخل الاجابة باللغة العربية'
        },
        title             : 'العنوان',
        dueDate           : 'تاريخ الاستحقاق',
        startDate         : 'تاريخ البدء',
        create            : 'إنشاء',
        questionType      : 'نوع السؤال',
        //preview
        titlePreview      : 'استطلاع عملاء جديد',
        respondents       : 'المستجيبين',
        duplicateBtn      : 'تكرار إنشاء',
        editBtn           : 'تعديل',
        respondent        : 'المستجيب',
        answer            : 'اجابة',
        saveBtn           : 'حفظ',
        sendBtn           : 'ارسال',
        goToBtn           : 'الذهاب الى',
        questionaryPreview: 'معاينة استطلاع العملاء',
        okBtn             : 'موافق',

        //edit answer
        editAnswerViewTitle: '', // todo

        // top Bar
        all   : 'استطلاع العملاء الخاص بالعلالي',
        newBtn: 'استطلاع عملاء جديد',
        of    : 'من'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
