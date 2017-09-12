define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list
        location: 'الموقع',
        endDate : ' الموعد المحدد',

        // create
        titleQuestionary : ' استطلاع',
        aboutSKUFormat   : 'فيما يتعلق برمز الهوية',
        addNewBtn        : 'أضف سلعة جديدة',
        deleteBtn        : 'حذف السلعة',
        delete: '', // todo
        questions        : 'الاسئلة',
        type             : 'نوع الاستطلاع',
        options          : 'خيارات',
        createQuestionary: 'انشاء استطلاع',

        //create Question
        enterQuestion     : {
            en: 'Ar Enter Question in English', // todo
            ar: '' // todo translation
        },
        enterTitle     : {
            en: 'Ar Enter Title in English', // todo
            ar: '' // todo translation
        },
        enterOption     : {
            en: 'Ar Enter Option to choose in English', // todo
            ar: '' // todo translation
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
        editAnswerViewTitle: '', // todo

        // top Bar
        all   : 'استطلاع العلالى',
        newBtn: 'جديد',
        of    : 'من'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
