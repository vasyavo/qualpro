var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var shelfSharesTranslation = {
    // body
    max: 'max',
    mid: 'mid',
    min: 'min',

    // header
    total: 'Total 100%',
    brand: 'Brand',

    // list
    product: 'Product',

    // preview
    timeStamp: 'Time Stamp',
    branch   : 'Branch',
    value    : 'Value',
    employee : 'Employee',
    options  : 'Options',
    saveBtn  : 'Save',
    okBtn: 'Ok',
    delete: 'Delete',
    edit: 'Edit',

    // top Bar
    all: 'Shelf shares',
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, shelfSharesTranslation);
