var _ = require('underscore');
var parent = require('./parrent');
var validation = require('../validation');
var CONSTANTS = require('../constants/otherConstants');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    defaults      : {},
    attachmentsKey: 'attachments',

    fieldsToTranslate: [
        'country',
        'promotionType',
        'category',
        'region',
        'subRegion',
        'retailSegment',
        'outlet',
        'branch',
        'displayType',
        'barcode',
        'packing',
        'ppt',
        'totalQuantity',
        'endDate',
        'startDate',
        'attachments'
    ],

    multilanguageFields: [
        'promotionType',
        'createdBy.user.firstName',
        'createdBy.user.lastName',
        'createdBy.user.accessRole.name',
        'createdBy.user.position.name',
        'category.name',
        'country.name',
        'region.name',
        'subRegion.name',
        'retailSegment.name',
        'outlet.name',
        'branch.name',
        'displayType.name'
    ],

    validate: function (attrs, cb) {
        var errors = [];

        if (this.translatedFields.barcode) {
            validation.checkNumberField(errors, true, attrs.barcode, this.translatedFields.barcode);
        }
        if (this.translatedFields.packing) {
            validation.checkZipField(errors, true, attrs.packing, this.translatedFields.packing);
        }
        if (this.translatedFields.ppt) {
            validation.checkPriceField(errors, true, attrs.ppt, this.translatedFields.ppt);
        }
        if (this.translatedFields.totalQuantity) {
            validation.checkNumberField(errors, true, attrs.quantity, this.translatedFields.totalQuantity);
        }
        if (this.translatedFields.country) {
            validation.checkForValuePresence(errors, true, attrs.country, this.translatedFields.country);
        }
        if (this.translatedFields.promotionType) {
            validation.checkDescriptionField(errors, true, attrs.promotionType, this.translatedFields.promotionType);
        }
        if (this.translatedFields.region) {
            validation.checkForValuePresence(errors, true, attrs.region, this.translatedFields.region);
        }
        if (this.translatedFields.subRegion) {
            validation.checkForValuePresence(errors, true, attrs.subRegion, this.translatedFields.subRegion);
        }
        if (this.translatedFields.retailSegment) {
            validation.checkForValuePresence(errors, true, attrs.retailSegment, this.translatedFields.retailSegment);
        }
        if (this.translatedFields.outlet) {
            validation.checkForValuePresence(errors, true, attrs.outlet, this.translatedFields.outlet);
        }
        if (this.translatedFields.category) {
            validation.checkForValuePresence(errors, true, attrs.category, this.translatedFields.category);
        }
        if (this.translatedFields.displayType) {
            validation.checkForValuePresence(errors, true, attrs.displayType, this.translatedFields.displayType);
        }
        if (this.translatedFields.startDate) {
            validation.checkForValuePresence(errors, true, attrs.dateStart, this.translatedFields.startDate);
        }
        if (this.translatedFields.endDate) {
            validation.checkForValuePresence(errors, true, attrs.dateEnd, this.translatedFields.endDate);
        }
        if (this.translatedFields.branch) {
            validation.checkForValuePresence(errors, true, attrs.branch, this.translatedFields.branch);
        }
        if (this.translatedFields.attachments) {
            validation.checkForValuePresence(errors, true, attrs.attachments, this.translatedFields.attachments);
        }


        if (errors.length > 0) {
            return cb(errors);
        }
        return cb(null);
    },

    modelMapper: function (key, model) {
        return model[key] ? _.map(model[key], function (el) {
            return el && el.name.currentLanguage || ' ';
        }).join(', ') : ' ';
    },

    urlRoot: function () {
        return CONTENT_TYPES.PROMOTIONS;
    },

    modelParse: function (model) {
        var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
        var statuses = CONSTANTS.CONTRACTS_UI_STATUSES;
        var status = _.findWhere(statuses, {_id: model.status});

        model.status = status;
        model.status.name.currentLanguage = model.status.name[currentLanguage];
        model.statusClass = status._id + 'Status';

        model.countryString = model.country ? model.country.name.currentLanguage : '';
        model.categoryString = model.category ? model.category.name.currentLanguage : '';
        model.regionString = this.modelMapper('region', model);
        model.subRegionString = this.modelMapper('subRegion', model);
        model.retailSegmentString = this.modelMapper('retailSegment', model);
        model.outletString = this.modelMapper('outlet', model);
        model.branchString = this.modelMapper('branch', model);
        model.promotionTypeString = model.promotionType ? model.promotionType.currentLanguage : '';
        model.displayTypeString = model.displayType.map(function (item) {
            return item.name[App.currentUser.currentLanguage];
        }).join(', ');

        model.location = model.countryString + '>' + model.regionString + '>' + model.subRegionString + '>' + model.retailSegmentString + '>' + model.outletString + '>' + model.branchString;


        return model;
    }
});
