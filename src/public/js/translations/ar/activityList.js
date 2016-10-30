define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list
        activity: 'النشاط',
        location: 'الموقع',
        user    : 'المستخدم',
        date    : 'التاريخ',
        all     : 'قائمة الأنشطة'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
