define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters',
    'translations/ar/personnel',
    'translations/ar/visibilityForm'
], function (_, paginationTranslation, filtersTranslation, personnelTranslation, visibilityForm) {
    'use strict';

    var translation = {
        assignToPersonnel: personnelTranslation,

        // btn
        okBtn      : 'موافق',
        saveBtn    : 'حفظ',
        sendBtn    : 'أرسال',
        cancelBtn  : ' إلغاء',
        action     : 'اتخاذ إجراء',
        attachFiles: 'إرفاق ملفات',
        assign     : 'تعيين',
        attach     : 'إرفاق',
        reAssign   : ' إعادة تعيين',

        // everything else
        all            : 'البالغات في المتاجر',
        allTasks       : 'جميع المهام',
        assignedToMe   : 'المعينة لي',
        createdByMe    : 'تم إنشاؤه من قبلي',
        myCoverTasks   : 'المهام المغطاة بالإنابة',
        closed         : 'المغلقة',
        newTask        : 'مهمة جديدة',
        priority       : 'الأولوية',
        location       : 'الموقع',
        endDate        : 'تاريخ الانتهاء',
        status         : 'الحالة',
        createTask     : 'إنشاء مهمة',
        title          : 'عنوان النص',
        assignTo       : 'تعيين الى',
        assignBy       : 'المعينة بواسطة',
        selectPersonnel: 'اختر الموظف',
        draft          : 'مسودة',
        startDate      : 'تاريخ البدء',
        dueDate        : 'تاريخ الاستحقاق',
        description    : 'الوصف',
        attachments    : 'المرفقات',
        linkForm       : 'ربط نموذج',
        files          : 'الملفات',
        taskPreview    : 'معاينة المهمة',
        main           : 'الرئيسية',
        taskFlow       : 'مراحل تطور المهمة',
        type           : 'النوع',
        commentText    : 'نص التعليق',
        coveringFor    : 'ينوب عن',
        creationDate   : 'تاريخ الإنشاء',

        // edit
        duplicateInStore: 'تكرار انشاء المهام فى المتاجر',
        editInStore     : 'تعديل بيانات المهام فى المتاجر',
        noTranslation   : ' لا يوجد ترجمة',
        edit            : 'تعديل البيانات',
        duplicate       : 'تكرار ',

        // form
        form       : 'النمازج',
        goToBtn    : 'الذهاب الى',
        dialogTitle: ' ملفات المهام في المتاجر'
    };

    return _.extend({}, paginationTranslation, filtersTranslation, translation, visibilityForm);
});

