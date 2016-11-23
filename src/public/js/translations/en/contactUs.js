define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
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

        // topBar
        all        : 'Contact Us',
        okBtn      : 'Ok',
        sendBtn    : 'Send',
        attachBtn    : 'Attach'

    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
