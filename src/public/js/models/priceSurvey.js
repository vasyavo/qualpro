var parent = require('./parrent');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    idAttribute: '_id',

    multilanguageFields: [
        'category.name',
        'brands.brand.name',
        'brands.variants.variant.name',
        'brands.variants.branches.branch.name',
        'branchesAll.name'
    ],

    urlRoot: function () {
        return CONTENT_TYPES.PRICESURVEY;
    }
});
