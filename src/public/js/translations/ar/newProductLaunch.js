define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var newProductLaunch = {
        // list
        productCategory: ' إطلاق منتج جديد ',
        variant        : "النوع",
        packaging      : 'التغليف ',
        location       : 'الموقع ',
        fromTo         : 'من:الى ',
        // preview
        all            : ' إطلاق منتج جديد ',
        saveBtn        : 'موافق ',
        category       : 'الفئة ',
        brand          : 'المنافس ',

        employee     : 'الموظف ',
        country      : 'الدولة ',
        region       : 'المنطقة ',
        subRegion    : 'المنطقة الفرعية ',
        retailSegment: 'الفئة التجارية ',
        outlet       : 'العميل ',
        branch       : 'الفرع ',
        attachments  : 'الملفات المرفقة ',
        comment      : 'التعليق ',
        origin       : 'بلد المنشأ ',
        packing      : 'التغليف ',
        price        : 'سعر البيع للمستهلك ',
        displayType  : 'نوع العرض ',
        distributor  : 'الموزع ',
        shelfLife    : 'تاريخ الانتاج / تاريخ الانتهاء',
        startDate    : 'تاريخ البدء',
        endDate      : 'تاريخ الانتهاء',

        goToBtn      : 'الذهاب الى',
        edit         : 'تعديل بيانات',
        delete: '', // todo
        newProductLaunchEditTitle : '', // todo
    };
    return _.extend({}, paginationTranslation, filtersTranslation, newProductLaunch);
});
