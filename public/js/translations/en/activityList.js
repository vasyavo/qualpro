define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list
        activity: 'Activity',
        location: 'Location',
        user    : 'User',
        date    : 'Date',
        all     : 'Activity List'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
