define([
    'Underscore',
    'translations/en/filters'
], function (_, filtersTranslation) {
    return _.extend({}, {
        of   : 'of',
        items: 'items',
        page : 'Page',
        next : 'Next',
        prev : 'Prev'
    }, filtersTranslation);
});
