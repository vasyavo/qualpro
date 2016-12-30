define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters',
    'translations/en/brandingActivityItems'
], function (_, paginationTranslation, filtersTranslation, brandingAndDisplayItems) {
    var brandingAndDisplayTranslation = {
        // top bar
        all                : ' Al Alali Marketing Campaigns',
        newBranding        : 'New Marketing Campaign',
        // list
        startDate          : 'Start date',
        endDate            : 'Due date',
        location           : 'Location',
        item               : 'Item:',
        promotionType      : 'Promotion Type: ',
        // create
        createTitle        : 'Create Branding Activity',
        publishBtn         : 'Publish',
        cancelBtn          : 'Cancel',
        attachments        : 'Attachments',
        attachFiles        : 'Attach Files',
        attachTitle        : 'Branding Activity Items comment files',
        attach             : 'Attach',
        description        : 'Description',
        selectTitle        : 'Select Title',
        selectCountry      : 'Select country',
        selectCategory     : 'Select category',
        selectRegion       : 'Select region',
        selectSubRegion    : 'Select sub-region',
        selectRetailSegment: 'Select trade channel',
        selectOutlet       : 'Select customer',
        selectBranch       : 'Select branch',
        // edit
        saveBtn            : 'Save',
        duplicateBranding  : 'Duplicate branding activity activity',
        editBranding       : 'Edit branding activity activity',
        // preview
        okBtn              : 'Ok',
        preViewTitle       : 'View Branding Activity',
        table              : 'Table',
        edit               : 'Edit',
        duplicate          : 'Duplicate',
        brand              : 'Brand',
        category           : 'Category',
        displayType        : 'Display Type',
        country            : 'Country',
        region             : 'Region',
        subRegion          : 'Sub-Region',
        retailSegment      : 'Trade channel',
        outlet             : 'Customer',
        branch             : 'Branch',
        noTranslation      : 'No Translation',
        goToBtn            : 'Go to',
        send               : 'Send',
        addTranslation     : {
            en: 'Add arabic translation',
            ar: 'Add english translation'
        },

        dialogTitle     : 'Branding Activity files',
        attachButtonName: 'Attach',
        viewDetails     : 'View details',
        commentText     : 'Comment Text',
        comments        : 'Comments'

    };
    return _.extend({}, paginationTranslation, filtersTranslation, brandingAndDisplayTranslation, brandingAndDisplayItems);
});
