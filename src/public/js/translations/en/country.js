var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var cropImagesTranslation = require('./cropImages');
var actionTranslation = require('./action');

var countryTranslation = {
    crop           : cropImagesTranslation,
    // top bar
    all            : 'Countries',
    archive        : 'Archive',
    firstBreadCrumb: 'Countries',
    newDomain      : 'New Country',
    selectAll      : 'Select all',
    okBtn          : 'Ok',
    // list
    flag           : 'Flag',
    name           : 'Name',
    createdBy      : 'Created By',
    // create
    createTitle    : 'Create Country',
    labelName      : 'Country Name',
    labelCurrency  : 'Currency',
    addImage       : 'Add image',
    addTranslation : {
        en: 'Add arabic translation',
        ar: 'Add english translation'
    },

    createBtn   : 'Create',
    cancelBtn   : 'Cancel',
    currencyPH  : 'Input currency name',
    // edit
    editTitle   : 'Edit Country',
    changeImage : 'Change image',
    saveBtn     : 'Save',
    // preview
    previewTitle: 'View Country',
    domainName  : 'Country'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, countryTranslation, actionTranslation);
