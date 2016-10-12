define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/cropImages',
    'translations/ar/filters'
], function (_, paginationTranslation, cropImagesTranslation, filtersTranslation) {
    var regionTranslation = {
        crop           : cropImagesTranslation,
        // top bar
        all            : 'المنطقة',
        archive        : 'الأرشيف',
        firstBreadCrumb: 'الدول',
        newDomain      : 'منطقة جديدة',
        // list
        flag           : 'العلم',
        name           : 'الاسم',
        createdBy      : 'تم أنشأوها بواسطة',
        // create
        createTitle    : 'إنشاء منطقة',
        labelName      : 'اسم المنطقة',
        addImage       : 'إضافة صورة',
        addTranslation : {
            en: 'إضافة الترجمة العربية',
            ar: 'إضافة الترجمة الانجليزية'
        },

        createBtn   : 'إنشاء',
        cancelBtn   : 'إلغاء',
        // edit
        editTitle   : 'تعديل المنطقة',
        changeImage : 'تغيير الصورة',
        saveBtn     : 'حفظ',
        // preview
        previewTitle: 'عرض المنطقة',
        domainName  : 'المنطقة'
    };

    return _.extend({}, paginationTranslation, regionTranslation, filtersTranslation);
});
