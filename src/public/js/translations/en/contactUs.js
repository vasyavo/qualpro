var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var translation = {
    // list view
    title: 'Title',
    type: 'Type',
    resolved : 'resolved',

    // preview
    employeeName : 'Employee Name',
    country : 'Country',
    dateCreated  : 'Date Created',
    status : 'Status',
    titlePreview : 'Contact Us',
    description  : 'Description',
    attachments  : 'Attachments',
    files        : 'Files',
    noTranslation: 'no Translation',
    resolveBtn : 'Resolve',
    comments : 'Comments',
    attachmentsDialogTitle : 'Contact Us files',

    // topBar
    all        : 'Contact Us',
    okBtn      : 'Ok',
    sendBtn    : 'Send',
    attachBtn    : 'Attach'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
