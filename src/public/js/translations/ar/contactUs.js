define([
    'Underscore',
    'translations/ar/pagination',
    'translations/ar/filters'
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
        attachmentsDialogTitle : 'Contact Us files', //todo ar translation

        // topBar
        all        : 'Contact Us',
        okBtn      : 'Ok',
        sendBtn    : 'Send',
        attachBtn    : 'Attach'

    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
