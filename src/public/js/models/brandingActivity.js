define([
    'models/parrent',
    'validation',
    'constants/contentType',
    'constants/otherConstants'
], function (parent, validation, CONTENT_TYPES, CONSTANTS) {
    var Model = parent.extend({
        defaults      : {},
        attachmentsKey: 'attachments',

        fieldsToTranslate: [
            'country',
            'category',
            'region',
            'subRegion',
            'retailSegment',
            'outlet',
            'branch',
            'displayType',
            'description',
            'endDate',
            'startDate',
            'attachments'
        ],

        multilanguageFields: [
            'category.name',
            'country.name',
            'region.name',
            'subRegion.name',
            'retailSegment.name',
            'outlet.name',
            'branch.name',
            'createdBy.user.firstName',
            'createdBy.user.lastName',
            'createdBy.user.position.name',
            'createdBy.user.accessRole.name',
            'description',
            'displayType.name'
        ],

        validate: function (attrs, cb) {
            var errors = [];


            if (this.translatedFields.country) {
                validation.checkForValuePresence(errors, true, attrs.country, this.translatedFields.country);
            }
            if (this.translatedFields.category) {
                validation.checkForValuePresence(errors, true, attrs.category, this.translatedFields.category);
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
            if (this.translatedFields.displayType) {
                validation.checkForValuePresence(errors, true, attrs.displayType, this.translatedFields.displayType);
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
                return el && el.name.currentLanguage || ' ';
            }).join(', ') : ' ';
        },

        urlRoot: function () {
            return CONTENT_TYPES.BRANDING_ACTIVITY;
        },

        modelParse: function (model) {
            var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
            var statuses = CONSTANTS.CONTRACTS_UI_STATUSES;
            var status = _.findWhere(statuses, {_id: model.status});

            model.status = status;
            model.status.name.currentLanguage = model.status.name[currentLanguage];
            model.statusClass = status._id + 'Status';

            model.displayTypeString = model.displayType ? model.displayType.name.currentLanguage : '';
            model.countryString = this.modelMapper('country', model);
            model.categoryString = this.modelMapper('category', model);
            model.regionString = this.modelMapper('region', model);
            model.subRegionString = this.modelMapper('subRegion', model);
            model.retailSegmentString = this.modelMapper('retailSegment', model);
            model.outletString = this.modelMapper('outlet', model);
            model.branchString = this.modelMapper('branch', model);

            model.location = model.countryString + '>' + model.regionString + '>' + model.subRegionString + '>' + model.retailSegmentString + '>' + model.outletString + '>' + model.branchString;

            return model;
        }
    });

    return Model;
});
