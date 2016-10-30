define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var achievementFormTranslation = {
        // list
        description  : 'الوصف',
        comment      : 'التعليق',
        location     : 'الموقع',
        date         : 'التاريخ',
        // preview
        title        : 'عرض استمارة الإنجازات',
        saveBtn      : 'موافق',
        employeeName : 'اسم الموظف',
        country      : 'البلد',
        region       : 'المنطقة',
        subRegion    : 'المنطقة الفرعية',
        retailSegment: 'قطاع التجزئة',
        outlet       : 'العميل',
        branch       : 'الفرع',
        attachments  : 'المرفقات',
        noTranslation: ' لا يوجد ترجمة',
        files        : 'الملفات',
        all          : 'استمارة الإنجازات'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, achievementFormTranslation);
});
