define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/cropImages',
    'translations/ar/filters'
], function (_, paginationTranslation, cropImagesTranslation, filtersTranslation) {
    var translation = {
        crop           : cropImagesTranslation,
        name           : 'الاسم',
        country        : 'الدولة',
        barcode        : ' الباركود',
        ppt            : ' سعر البيع للتاجر',
        origin         : 'بلد المنشأ',
        manageCat      : 'إدارة الفئات، المنوعات والسلع',
        listedItems    : ' السلع المدرجة',
        all            : ' السلع والأسعار',
        itemsToCustomer: 'اضافة السلع للعملاء',
        manageItem     : 'إدارة السلع والأسعار',
        action         : ' اتخاذ إجراء',
        disable        : ' إلغاء تفعيل',
        unDisable      : ' إعادة تفعيل',
        packing        : 'التغليف',
        product        : 'المنتج',
        archive        : ' الأرشيف',
        retailSegment  : 'قطاع التجزئة',
        outlet         : 'العميل',
        okBtn          : 'موافق',
        cancelBtn      : 'إلغاء',
        saveBtn        : 'موافق',
        createItems    : 'إنشاء السلع',
        closeBtn       : 'إغلاق',
        category       : 'الفئة',
        item           : 'السلعة: ',
        variant        : 'النوع',
        englishName    : 'الاسم باللغة الانكليزية',
        arabicName     : 'الاسم باللغة بالعربية'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
