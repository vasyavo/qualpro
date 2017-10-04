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
    titlePreview : 'al alali Branding & Monthly display',
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
    missedData   : 'Missed data',
    edit: 'Edit',
    delete: 'Delete',

    // edit
    saveBtn: 'Save',
    brandingAndMonthlyDisplayEditTitle: 'Edit branding and monthly display report',

    // topBar
    all        : 'al alali Branding & Monthly display',
    okBtn      : 'Ok',
    dialogTitle: 'Comment attachments'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
