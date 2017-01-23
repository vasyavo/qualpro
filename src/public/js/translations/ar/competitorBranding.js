define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list view
        brand      : 'المنافس',
        category   : 'الفئة',
        displayType: 'نوع العرض',

        startDate: 'تاريخ البدء',
        endDate  : 'تاريخ الانتهاء',
        location : 'الموقع',

        // preview
        titlePreview : 'عرض بيانات النشاط التسويقي',
        country      : 'الدولة',
        region       : 'المنطقة',
        subRegion    : 'المنطقة الفرعية',
        retailSegment: 'الفئة التجارية',
        outlet       : 'العميل',
        branch       : 'الفرع',
        description  : 'الوصف',
        attachments  : 'الملفات المرفقة',
        files        : 'الملفات',
        attachBtn    : 'ارفاق',
        sendBtn      : 'ارسال',
        noTranslation: ' لا يوجد ترجمة ',
        skipped      : 'تخطي',
        commentText  : 'التعليق',

        // topBar
        all        : ' العلامات التجارية وتقارير العرض للمنافسين',
        okBtn      : 'موافق',
        dialogTitle: ' التعليقات والمرفقات',
        goToBtn : '' //todo

    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
