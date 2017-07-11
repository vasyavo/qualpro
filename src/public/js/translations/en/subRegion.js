var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var cropImagesTranslation = require('./cropImages');

var subRegionTranslation = {
    crop           : cropImagesTranslation,
    // top bar
    all            : 'Sub Region',
    archive        : 'Archive',
    firstBreadCrumb: 'Countries',
    newDomain      : 'New Sub Region',
    selectAll      : 'Select All',
    okBtn          : 'Ok',

    // list
    flag          : 'Flag',
    name          : 'Name',
    createdBy     : 'Created By',
    // create
    createTitle   : 'Create Sub Region',
    labelName     : 'Name',
    addImage      : 'Add image',
    addTranslation: {
        en: 'Add arabic translation',
        ar: 'Add english translation'
    },

    createBtn   : 'Create',
    cancelBtn   : 'Cancel',
    // edit
    editTitle   : 'Edit Sub Region',
    changeImage : 'Change image',
    saveBtn     : 'Save',
    // preview
    previewTitle: 'View Sub Region',
    domainName  : 'Sub-region'
};

module.exports = _.extend({}, paginationTranslation, filtersTranslation, subRegionTranslation);
