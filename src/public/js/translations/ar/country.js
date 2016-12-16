define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/cropImages',
    'translations/ar/filters',
    'translations/ar/action',
], function (_, paginationTranslation, cropImagesTranslation, filtersTranslation, actionsTranslation) {
    var countryTranslation = {
        crop           : cropImagesTranslation,
        // top bar
        all            : 'الدول',
        archive        : 'الأرشيف',
        firstBreadCrumb: 'الدول',
        newDomain      : 'دولة جديدة',
        selectAll      : 'اختيار الكل',
        // list
        flag           : 'العلم',
        name           : 'الاسم',
        createdBy      : 'تم إنشائها بواسطة',
        // create
        createTitle    : 'إنشاء دولة',
        labelName      : 'اسم الدولة',
        labelCurrency  : 'العملة',
        addImage       : 'إضافة صورة',
        addTranslation : {
            en: 'إضافة الترجمة العربية',
            ar: 'إضافة الترجمة الانجليزية'
        },

        createBtn   : 'إنشاء',
        cancelBtn   : ' إلغاء',
        currencyPH  : 'اختر العملة',
        // edit
        editTitle   : 'تعديل العملة',
        changeImage : 'تغيير الصورة',
        saveBtn     : 'حفظ',
        // preview
        previewTitle: 'عرض الدولة',
        domainName  : 'الدولة'
    };

    return _.extend({}, paginationTranslation, filtersTranslation, countryTranslation, actionsTranslation);
});
