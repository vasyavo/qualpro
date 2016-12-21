define([
    'Underscore',
    'translations/en/pagination',
    'translations/en/cropImages',
    'translations/en/filters'
], function (_, paginationTranslation, cropImagesTranslation, filtersTranslation) {
    var translation = {
        crop             : cropImagesTranslation,
        name             : 'Name',
        cropImages       : 'Crop Images',
        manageCompetitors: 'Manage Competitors',
        brand            : 'Brand',
        product          : 'Product',
        variant          : 'Variant',
        origin           : 'Origin',
        all              : 'Competitor List',
        archive          : 'Archive',
        packing          : 'Weight',
        country          : 'Country',
        closeBtn         : 'Close',
        category         : 'Category',
        item             : 'Item',
        createItems      : 'Create items',
        competitorVariant: 'Competitor Variant',
        competitorItem   : 'Competitor Item',
        action           : 'Action',
        disable          : 'Disable',
        unDisable        : 'Un Disable',
        englishName      : 'English Name',
        arabicName       : 'Arabic Name',
        addLogo          : 'Add logo',
        changeLogo       : 'Change logo'
    };
    return _.extend({}, paginationTranslation, filtersTranslation, translation);
});
