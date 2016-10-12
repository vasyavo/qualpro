define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    'use strict';

    var contractsSecondaryTranslation = {
        // top bar
        all                : 'Contracts Secondary',
        newContract        : 'New Contract',
        // list
        startDate          : 'Start date',
        endDate            : 'End date',
        location           : 'Location',
        // create
        createTitleContract: 'Create Contract',
        titleInput         : 'Input title',
        title              : 'Title',
        createTitle        : 'Create Document',
        createBtn          : 'Create',
        publishBtn         : 'Publish',
        cancelBtn          : 'Cancel',
        attachments        : 'Attachments',
        attachFiles        : 'Attach Files',
        inputActivity      : 'Input activity',
        inputPromotion     : 'Input promotion',
        inputBudget        : 'Input budget',
        inputActual        : 'Input actual',
        inputSalesTarget   : 'Input sales target',
        selectCountry      : 'Select country',
        selectRegion       : 'Select region',
        selectSubRegion    : 'Select sub-region',
        selectRetailSegment: 'Select trade channel',
        selectOutlet       : 'Select customer',
        selectBranch       : 'Select branch',
        selectCategory     : 'Select category',
        // edit
        editTitle          : 'Edit Contract',
        duplicateTitle     : 'Duplicate Contract',
        saveBtn            : 'Save',
        // preview
        okBtn              : 'Ok',
        preViewTitle       : 'View Contract',
        edit               : 'Edit',
        duplicate          : 'Duplicate',
        type               : 'Type',
        category           : 'Category',
        activity           : 'Activity',
        promotion          : 'Promotion',
        displayType        : 'Display Type',
        budget             : 'Budget',
        actual             : 'Actual',
        salesTarget        : 'Sales Target',
        country            : 'Country',
        region             : 'Region',
        subRegion          : 'Sub-Region',
        retailSegment      : 'Trade channel',
        outlet             : 'Customer',
        branch             : 'Branch',
        status             : 'Status',
        description        : 'Description',
        noInfo             : 'No information',
        goToBtn            : 'Go to',
        addTranslation     : {
            en: 'Add arabic translation',
            ar: 'Add english translation'
        },

        attach          : 'Attach',
        documentFile    : 'Document Files',
        attachButtonName: 'New Document',
        dialogTitle     : 'All Documents',
        rightTitle      : 'Attached Documents'

    };

    return _.extend({}, paginationTranslation, filtersTranslation, contractsSecondaryTranslation);
});
