define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var translation = {
        // list view
        brand      : 'Brand',
        category   : 'Category',
        displayType: 'Display Type',
        startDate  : 'Start date',
        endDate    : 'Due date',
        location   : 'Location',

        // preview
        titlePreview : 'Contact Us',
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
