define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
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
        missedData   : '', // todo
        edit         : 'تعديل بيانات',
        delete: 'حذف',

        // edit
        saveBtn: 'حفظ',
        brandingAndMonthlyDisplayEditTitle: '', // todo

        // topBar
        all: ' العلامات التجارية وتقارير العرض للمنافسين',
        okBtn: 'موافق',
        dialogTitle: ' التعليقات والمرفقات',
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
