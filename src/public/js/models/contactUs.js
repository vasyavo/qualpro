var parent = require('./parrent');
var validation = require('../validation');
var custom = require('../custom');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    defaults      : {},
    attachmentsKey: 'attachments',

    fieldsToTranslate: [
        'title',
        'type',
        'description',
        'endDate',
        'startDate',
        'attachments'
    ],

    multilanguageFields: [
        'description'
    ],

    validate: function (attrs, cb) {
        var errors = [];

        if (!attrs.type) {
            errors.push('Type field  can not be empty');
        }
        if (this.translatedFields.description) {
            validation.checkDescriptionField(errors, true, attrs.description, this.translatedFields.description);
        }
        if (this.translatedFields.startDate) {
            validation.checkForValuePresence(errors, true, attrs.dateStart, this.translatedFields.startDate);
        }
        if (this.translatedFields.endDate) {
            validation.checkForValuePresence(errors, true, attrs.dateEnd, this.translatedFields.endDate);
        }
        if (this.translatedFields.attachments) {
            validation.checkForValuePresence(errors, false, attrs.attachments, this.translatedFields.attachments);
        }

        if (errors.length > 0) {
            return cb(errors);
        }

        return cb(null);
    },

    urlRoot: function () {
        return CONTENT_TYPES.CONTACT_US;
    },

    modelMapper: function (key, model) {
        return model[key] ? _.map(model[key], function (el) {
            return el.name.currentLanguage || ' ';
        }).join(', ') : ' ';
    },

    modelParse: function (model) {
        model.categoryString = this.modelMapper('category', model);
        model.countryString = model.country ? model.country.name.currentLanguage : '';
        model.regionString = model.region ? model.region.name.currentLanguage : '';
        model.subRegionString = model.subRegion ? model.subRegion.name.currentLanguage : '';
        model.retailSegmentString = model.retailSegment ? model.retailSegment.name.currentLanguage : '';
        model.outletString = model.outlet ? model.outlet.name.currentLanguage : '';
        model.branchString = model.branch ? model.branch.name.currentLanguage : '';
        model.brandString = model.brand ? model.brand.name.currentLanguage : '';
        model.displayTypeString = model.displayType ? model.displayType.name.currentLanguage : '';

        model.location = model.countryString + '>' + model.regionString + '>' + model.subRegionString + '>' + model.retailSegmentString + '>' + model.outletString + '>' + model.branchString;
    }
});
