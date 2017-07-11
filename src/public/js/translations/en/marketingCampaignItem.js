var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var brandingAndDisplayTranslation = {
    // header
    brandingItemsTable: 'Marketing Campaign Items Table',
    employee          : 'Employee',
    comment           : 'Comment',
    // body
    createdBy: 'Created By',
    edit: 'Edit',
    delete: 'Delete',
    editCommentViewTitle: 'Edit comment of marketing campaign',
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, brandingAndDisplayTranslation);
