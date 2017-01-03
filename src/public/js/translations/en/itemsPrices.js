define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/cropImages',
    'translations/en/filters'
], function (_, paginationTranslation, cropImagesTranslation, filtersTranslation) {
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
        unDisable      : 'Un Disable',
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
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
