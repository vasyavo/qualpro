var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    // list view
    brand      : 'Brand',
    category   : 'Category',
    displayType: 'Display Type',
    startDate  : 'Start date',
    endDate    : 'Due date',
    location   : 'Location',

    // preview
    titlePreview : 'View Branding & Display Activity',
    country      : 'Country',
    region       : 'Region',
    subRegion    : 'Sub-Region',
    retailSegment: 'Trade Channel',
    outlet       : 'Customer',
    branch       : 'Branch',
    description  : 'Description',
    attachments  : 'Attachments',
    files        : 'Files',
    attachBtn    : 'Attach',
    sendBtn      : 'Send',
    noTranslation: 'no Translation',
    skipped      : 'Skipped',
    commentText  : 'Comment Text',
    edit         : 'Edit',
    delete: 'Delete',
    saveBtn : 'Save',

    // edit
    competitorBrandingEditTitle: 'Edit competitor branding',

    // topBar
    all        : 'Competitor branding & display report',
    okBtn      : 'Ok',
    dialogTitle: 'Comment attachments',
    goToBtn : 'Go to'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
