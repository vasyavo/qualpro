var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var cropImagesTranslation = require('./cropImages');

var translation = {
    crop           : cropImagesTranslation,
    name           : 'Name',
    country        : 'Country',
    barcode        : 'Barcode',
    ppt            : 'PTT',
    rspMin         : 'RSP Min',
    rspMax         : 'RSP Max',
    pptPerCase     : 'PTT Per Case',
    origin         : 'Origin',
    manageCat      : 'Manage categories, variants & items',
    listedItems    : 'Listed Items',
    all            : 'Items and Prices',
    itemsToCustomer: 'Items To Customer',
    manageItem     : 'Manage Items and Prices',
    action         : 'Action',
    disable        : 'Disable',
    unDisable      : 'Enable',
    packing        : 'Weight',
    product        : 'Product',
    archive        : 'Archive',
    retailSegment  : 'Trade channel',
    outlet         : 'Customer',
    okBtn          : 'Ok',
    cancelBtn      : 'Cancel',
    saveBtn        : 'Save',
    createItems    : 'Create Items',
    closeBtn       : 'Close',
    category       : 'Category',
    item           : 'Item',
    variant        : 'Variant',
    englishName    : 'English Name',
    arabicName     : 'Arabic Name'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
