var _ = require('underscore');
var parent = require('./parrent');
var FileModel = require('./file');
var validation = require('../validation');
var custom = require('../custom');
var CONSTANTS = require('../constants/otherConstants');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    defaults      : {},
    attachmentsKey: 'documents',

    fieldsToTranslate: [
        'type',
        'country',
        'region',
        'subRegion',
        'retailSegment',
        'outlet',
        'branch',
        'description',
        'endDate',
        'startDate',
        'attachments'
    ],

    multilanguageFields: [
        'description',
        'createdBy.user.firstName',
        'createdBy.user.lastName',
        'createdBy.user.accessRole.name',
        'createdBy.user.position.name',
        'country.name',
        'region.name',
        'subRegion.name',
        'retailSegment.name',
        'outlet.name',
        'branch.name'
    ],

    validate: function (attrs, cb) {
        var errors = [];


        if (this.translatedFields.country) {
            validation.checkForValuePresence(errors, true, attrs.country, this.translatedFields.country);
        }
        if (this.translatedFields.type) {
            validation.checkForValuePresence(errors, true, attrs.type, this.translatedFields.type);
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
        if (this.translatedFields.description) {
            validation.checkDescriptionField(errors, true, attrs.description, this.translatedFields.description);
        }

        if (errors.length > 0) {
            return cb(errors);
        }
        return cb(null);
    },

    modelMapper: function (key, model) {
        return model[key] ? _.map(model[key], function (el) {
            return el.name.currentLanguage || ' ';
        }).join(', ') : ' ';
    },

    urlRoot: function () {
        return CONTENT_TYPES.CONTRACTSYEARLY;
    },

    modelParse: function (model) {
        var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
        var statuses = CONSTANTS.CONTRACTS_UI_STATUSES;
        var status = _.findWhere(statuses, {_id: model.status});
        var country = model.country ? model.country.name.currentLanguage : '';

        model.status = status;
        model.status.name.currentLanguage = model.status.name[currentLanguage];
        model.statusClass = status._id + 'Status';

        model.regionString = this.modelMapper('region', model);
        model.subRegionString = this.modelMapper('subRegion', model);
        model.retailSegmentString = this.modelMapper('retailSegment', model);
        model.outletString = this.modelMapper('outlet', model);
        model.branchString = this.modelMapper('branch', model);

        model.location = country + '>' + model.regionString + '>' + model.subRegionString + '>' + model.retailSegmentString + '>' + model.outletString + '>' + model.branchString;

        _.map(CONSTANTS.CONTRACTS_TYPE, function (type) {
            if (type._id === model.type) {
                model.type = type;
                model.type.name.currentLanguage = type.name[currentLanguage];
            }
        });

        var fileModel = new FileModel();

        var documents = model.documents.map(function (doc) {
            doc.attachment.type = fileModel.getTypeFromContentType(doc.attachment.contentType);
            doc.preview = doc.attachment.preview;

            return doc;
        });

        model.documents = documents;

        return model;
    }
});
