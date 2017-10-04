var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var branchTranslation = require('./branch');
var cropImagesTranslation = require('./cropImages');
var actionTranslation = require('./action');

var retailSegmentTranslation = {
    crop           : cropImagesTranslation,
    branch         : branchTranslation,
    // top bar
    all            : 'Customers',
    archive        : 'Archive',
    firstBreadCrumb: 'Countries',
    newDomain      : 'New Branch',
    selectAll      : 'Select all',
    newButton      : 'New Customer',
    okBtn          : 'Ok',

    // list
    flag          : 'Flag',
    name          : 'Name',
    createdBy     : 'Created By',
    // create
    createTitle   : 'Create Customer',
    labelName     : 'Customer Name',
    addImage      : 'Add image',
    addTranslation: {
        en: 'Add arabic translation',
        ar: 'Add english translation'
    },

    createBtn   : 'Create',
    cancelBtn   : 'Cancel',
    // edit
    editTitle   : 'Edit Customer',
    changeImage : 'Change image',
    saveBtn     : 'Save',
    // preview
    previewTitle: 'View Customer',
    domainName  : 'Customer'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, retailSegmentTranslation, actionTranslation);
