var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var cropImagesTranslation = require('./cropImages');

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
    unDisable        : 'Enable',
    englishName      : 'English Name',
    arabicName       : 'Arabic Name',
    addLogo          : 'Add logo',
    changeLogo       : 'Change logo'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, translation);
