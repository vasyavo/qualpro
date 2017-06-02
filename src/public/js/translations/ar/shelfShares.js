define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var shelfSharesTranslation = {
        // body
        max: 'الحد الاقصى',
        mid: 'متوسط',
        min: 'الحد الادنى',

        // header
        total: 'العدد الإجمالي 100٪',
        brand: 'المنافس',

        //list
        product: 'المنتج',

        //preview
        timeStamp: 'وقت الدخول',
        branch   : 'الفرع',
        value    : 'القيمة',
        employee : 'الموظف',
        options  : 'الخيارات',

        saveBtn       : 'حفظ',

        //top Bar
        all: ' حصة الرف'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, shelfSharesTranslation);
});
