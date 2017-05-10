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

        // edit
        saveBtn: 'Save',
        brandingAndMonthlyDisplayEditTitle: 'Edit branding and monthly display report',

        // topBar
        all        : 'al alali Branding & Monthly display',
        okBtn      : 'Ok',
        dialogTitle: 'Comment attachments'


    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
