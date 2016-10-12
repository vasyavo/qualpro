define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/cropImages',
    'translations/ar/filters'
], function (_, paginationTranslation, cropImagesTranslation, filtersTranslation) {
    var translation = {
        crop             : cropImagesTranslation,
        name             : 'الاسم',
        cropImages       : ' تحديد جزء من الصورة',
        manageCompetitors: ' إدارة المنافسي',
        brand            : 'المنافس',
        product          : 'المنتج',
        variant          : "النوع",
        origin           : 'بلد المنشأ',
        all              : ' قائمة الشركات المنافسة',
        archive          : ' الأرشيف',
        packing          : 'التغليف',
        country          : 'الدولة',
        closeBtn         : 'إغلاق',
        category         : 'الفئة',
        item             : 'السلعة: ',
        createItems      : 'إنشاء السلع',
        competitorVariant: 'منوع المنافس',
        competitorItem   : 'سلعة المنافس',
        action           : ' اتخاذ إجراء',
        disable          : ' إلغاء تفعيل',
        unDisable        : ' إعادة تفعيل',
        englishName      : 'الاسم باللغة الانكليزية',
        arabicName       : 'الاسم باللغة بالعربية',
        addLogo          : 'إضافة شعار',
        changeLogo       : 'تغيير الاشعار'

    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
