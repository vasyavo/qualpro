define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list view
        startDate  : 'Start date',
        endDate    : 'Due date',
        title: 'Title',
        type: 'Type',

        // preview
        titlePreview : 'Contact Us',
        description  : 'Description',
        attachments  : 'Attachments',
        files        : 'Files',
        attachBtn    : 'Attach',
        sendBtn      : 'Send',
        noTranslation: 'no Translation',

        // topBar
        all        : 'Contact Us',
        okBtn      : 'Ok',
        dialogTitle: 'Comment attachments',

        //createView
        saveBtn: 'Save',
        publishBtn: 'Send',
        createTitle: 'Add New Contact Us Form',
        attachFiles: 'Attach File'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
