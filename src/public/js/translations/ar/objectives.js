define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/cropImages',
    'translations/ar/personnel',
    'translations/ar/filters',
    'translations/ar/visibilityForm'
], function (_, paginationTranslation, cropImagesTranslation, personnelTranslation, filtersTranslation,
             visibilityForm) {
    var translation = {
        crop             : cropImagesTranslation,
        assignToPersonnel: personnelTranslation,
        // top bar
        objectives       : 'الأهداف',
        allObjectives    : 'جميع الأهداف ',
        assignedToMe     : ' مخصصة لي',
        createdByMe      : ' تم إنشاؤه من قبلي',
        myCoverObjectives: ' الأهداف المغطاة',
        closed           : 'المغلقة',
        myCCObjectives   : '', //todo translation
        newObjective     : 'هدف جديد',
        // list
        priority         : 'الأولوية',
        endDate          : 'تاريخ الانتهاء',
        progress         : 'التقدم',
        location         : 'الموقع',
        coveringFor      : 'ينوب عن',

        // create
        titleCreate    : 'انشاء هدف جديد',
        title          : 'عنوان النص',
        type           : 'النوع',
        assignTo       : 'تعيين الى',
        status         : 'الحالة',
        draft          : 'مسودة',
        startDate      : 'تاريخ البدء',
        description    : 'الوصف',
        attachments    : 'المرفقات',
        action         : 'اتخاذ اجراء',
        attachFiles    : 'ارفاق ملفات',
        linkForm       : 'ربط نموذج',
        unlinkForm     : 'إلغاء ربط النموذج',
        files          : 'الملفات',
        commentText    : 'نص التعليق',
        reAssign       : ' إعادة تعيين',
        selectPersonnel: 'اختر الموظف',

        // edit
        titleEdit     : 'تعديل بيانات الهدف',
        titleDuplicate: 'تكرار انشاءالهدف',

        // distribution
        titleDistribution: 'نموذج التوزيع',
        product          : 'المنتج',
        variant          : "النوع",
        item             : 'السلعة',
        packing          : 'التغليف',

        // link form template
        formType: ' نوع النموذج',

        // preview
        titleObjective       : 'عرض الهدف',
        main                 : 'الرئيسى',
        objectivesTree       : ' هيكل الأهداف',
        okBtn                : 'موافق',
        viewSubObjective     : 'عرض الهدف الفرعى',
        titleSubObjectiveView: 'هدف فرعى',
        creationDate         : 'تاريخ الإنشاء',

        // subObjectives
        titleAssign     : 'تعيين الهدف',
        titleCreateSub  : 'انشاء هدف فرعى',
        companyObjective: 'هدف  الشركة',
        dontShow        : " عدم إظهار هدف الشركة في الأهداف الفرعية ",

        // updatePreview
        assignBy: ' تعيين بواسطة',
        attach  : 'ارفاق',
        send    : 'ارسال',

        // assignBtn
        areaMan  : 'مدير المنطقة الفرعية',
        salesMan : 'موظف المبيعات, المروج, موظف الشاحنة الصغيرة',
        duplicate: 'تكرار',
        edit     : 'تعديل بيانات',
        assign   : 'تعيين',

        // subObjective
        titleSubObjective : 'اهداف فرعية',
        createSubObjective: 'انشاء هدف فرعى',

        // form
        forms: 'النماذج',
        form : 'النموذج',

        // effort
        effort        : 'الجهود',
        employee      : 'الموظف',
        saveBtn       : 'حفظ',
        sendBtn       : 'ارسال',
        goToBtn       : 'الذهاب الى',
        addTranslation: {
            en: 'إضافة الترجمة العربية',
            ar: 'إضافة الترجمة الانجليزية'
        },

        dialogTitle: 'ملفات الاهداف',
        countOfAttachedFiles: '' // todo
    };

    return _.extend({}, paginationTranslation, filtersTranslation, translation, visibilityForm);
});
