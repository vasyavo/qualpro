define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var branchTranslation = {
        // top bar
        all            : 'الفرع',
        archive        : ' الأرشيف',
        firstBreadCrumb: 'الدول',
        newDomain      : 'فرع جديد',
        selectAll      : 'اختيار الكل',
        // list
        flag           : 'علم الدولة',
        name           : 'اسم',
        createdBy      : ' تم إنشاؤها بواسطة',
        // create
        createTitle    : ' فرع جديد',
        labelName      : 'اسم الفرع',
        labelRetSegment: 'قطاع التجزئة',
        labelOutlet    : 'العميل',
        labelAddress   : 'العنوان',
        labelMap       : 'الربط الى الخريطة',
        labelManager   : 'مدير الفرع',
        labelMobile    : 'الجوال',
        labelEmail     : 'البريد الإلكتروني',
        addImage       : 'إضافة صورة',
        addTranslation : {
            en: 'إضافة الترجمة العربية',
            ar: 'إضافة الترجمة الانجليزية'
        },

        createBtn    : 'إنشاء',
        okBtn        : 'موافق',
        cancelBtn    : 'إلغاء',
        retailSegment: 'ادخل اسم قطاع التجزئة',
        outlet       : 'ادخل اسم العميل',
        manager      : 'ادخل اسم المدير',
        // edit
        editTitle    : 'تعديل بيانات الفرع',
        changeImage  : ' تغيير الصورة',
        saveBtn      : 'حفظ',
        // preview
        previewTitle : 'عرض الفرع',
        domainName   : 'الفرع',
        address      : 's العنوان'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, branchTranslation);
});
