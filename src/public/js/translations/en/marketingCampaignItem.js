define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var brandingAndDisplayTranslation = {
        // header
        brandingItemsTable: 'Marketing Campaign Items Table',
        employee          : 'Employee',
        comment           : 'Comment',
        // body
        createdBy: 'Created By',
        edit: 'Edit',
        editCommentViewTitle: 'Edit comment of marketing campaign',
    };
    return _.extend({}, paginationTranslation, filtersTranslation, brandingAndDisplayTranslation);
});
