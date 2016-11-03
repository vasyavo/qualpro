define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var brandingAndDisplayTranslation = {
        // header
        brandingItemsTable: 'Branding and Display Items Table',
        employee          : 'Employee',
        comment           : 'Comment',
        // body
        createdBy: 'Created By'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, brandingAndDisplayTranslation);
});