define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var promotionsTranslation = {
        // top bar
        all                : 'Al Alali promo evaluation',
        newPromotion       : 'New Promotion',
        // list
        startDate          : 'Start date',
        endDate            : 'Due date',
        location           : 'Location',
        // table
        promotionItemsTable: 'Promotion Items Table',
        actualStartDate    : 'Actual Start Date',
        actualEndDate      : 'Actual Due Date',
        rsp                : 'RSP',
        status             : 'Status',
        opening            : 'Opening',
        sellIn             : 'Sell In',
        clothingStock      : 'Closing Stock',
        sellOut            : 'Sell Out',
        comment            : 'Comment',
        // create
        createTitle        : 'Create Promotion',
        publishBtn         : 'Publish',
        cancelBtn          : 'Cancel',
        attachments        : 'Attachments',
        attachFiles        : 'Attach Files',
        inputBarcode       : 'Input barcode',
        inputPacking       : 'Input weight',
        inputPpt           : 'Input ppt',
        inputTotalQuantity : 'Input total quantity',
        description        : 'Description',
        selectCountry      : 'Select country',
        selectRegion       : 'Select region',
        selectSubRegion    : 'Select sub-region',
        selectRetailSegment: 'Select trade channel',
        selectOutlet       : 'Select customer',
        selectBranch       : 'Select branch',
        commentText        : 'Comment Text',
        commentAttachments : 'Comment attachments',
        // edit
        saveBtn            : 'Save',
        duplicatePromotion : 'Duplicate Promotion',
        editPromotion      : 'Edit Promotion',
        // preview
        okBtn              : 'Ok',
        preViewTitle       : 'View Promotion',
        table              : 'Table',
        edit               : 'Edit',
        duplicate          : 'Duplicate',
        category           : 'Category',
        displayType        : 'Display Type',
        country            : 'Country',
        region             : 'Region',
        subRegion          : 'Sub-Region',
        retailSegment      : 'Trade channel',
        outlet             : 'Customer',
        branch             : 'Branch',
        barcode            : 'Barcode',
        packing            : 'Weight',
        ppt                : 'PTT',
        totalQuantity      : 'Total Quantity',
        promotionType      : 'Promotion Type',
        addTranslation     : {
            en: 'Add arabic translation',
            ar: 'Add english translation'
        },

        dialogTitle: 'Promotion files',
        attachBtn  : 'Attach',
        goToBtn    : 'Go to'

    };

    return _.extend({}, paginationTranslation, filtersTranslation, promotionsTranslation);
});
