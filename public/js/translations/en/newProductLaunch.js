define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/filters'
], function (_, paginationTranslation, filtersTranslation) {
    var newProductLaunch = {
        // list
        productCategory: 'Product category',
        variant        : 'Variant',
        packaging      : 'Packaging',
        location       : 'Location',
        fromTo         : 'From to',
        // preview
        all            : 'New product launch',
        saveBtn        : 'Ok',
        category       : 'Category',
        brand          : 'Brand',

        employee     : 'Employee',
        country      : 'Country',
        region       : 'Region',
        subRegion    : 'Sub-Region',
        retailSegment: 'Trade channel',
        outlet       : 'Customer',
        branch       : 'Branch',
        attachments  : 'Attachments',
        comment      : 'Comment',
        origin       : 'Origin',
        packing      : 'Packing',
        price        : 'RSP',
        displayType  : 'Display type',
        distributor  : 'Distributor',
        shelfLife    : 'Shelf life'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, newProductLaunch);
});
