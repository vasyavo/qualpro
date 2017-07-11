var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');

var priceSurveyTranslation = {
    // body
    max: 'max',
    mid: 'mid',
    min: 'min',
    avg: 'avg',
    median: 'med',

    // header
    total   : 'Total',
    brand   : 'Brand',
    variants: 'Variants',
    size    : 'Size',
    origin  : 'Origin',
    gms     : '(GMS.)',

    // list
    product : 'Product',
    category: 'category',

    // preview
    timeStamp: 'Time Stamp',
    branch   : 'Branch',
    value    : 'Value',
    employee : 'Employee',
    options  : 'Options',
    saveBtn  : 'Save',

    // topBar
    all: 'Price Survey'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, priceSurveyTranslation);
