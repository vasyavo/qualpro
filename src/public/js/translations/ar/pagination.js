define([
    'Underscore',
    'translations/ar/filters'
], function (_, filtersTranslation) {
    return _.extend({}, {
        of   : 'من',
        items: 'السلع',
        page : 'صفحة',
        next : 'التالي',
        prev : 'السابق'
    }, filtersTranslation);
});
