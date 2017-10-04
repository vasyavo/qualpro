var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var promotionsTranslation = {
    // top bar
    all                : 'al alali promo evaluation',
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
    openingStock       : 'Opening Stock',
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
    inputPpt           : 'Input ptt',
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
    editPromotionItem : 'Edit Promotion Item',
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
    options: 'Options',

    dialogTitle: 'Promotion files',
    attachBtn  : 'Attach',
    goToBtn    : 'Go to'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, promotionsTranslation);
