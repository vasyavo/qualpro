define([
    'Underscore',
    'translations/ar/filters'
], function (_, filtersTranslation) {
    return _.extend({}, {
        title    : ' تحديد جزء من الصورة',
        cancelBtn: 'إلغاء',
        cropBtn  : 'تحديد'
    }, filtersTranslation);
});
