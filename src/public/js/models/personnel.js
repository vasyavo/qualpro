var parent = require('./parrent');
var validation = require('../validation');
var CONTENT_TYPES = require('../constants/contentType');

module.exports = parent.extend({
    defaults: {
        imageSrc       : '',
        email          : '',
        dateJoined     : null,
        lastAccess     : null,
        access         : null,
        position       : null,
        vacation       : {onLeave: false},
        archived       : false,
        manager        : null,
        retailSegment  : [],
        outlet         : [],
        country        : [],
        region         : [],
        subRegion      : [],
        currentLanguage: 'en'
    },

    fieldsToTranslate: [
        'firstName',
        'lastName',
        'phoneNumber',
        'email',
        'accessRole',
        'position',
        'country',
        'region',
        'subRegion',
        'branch'
    ],

    multilanguageFields: [
        'firstName',
        'lastName',
        'position.name',
        'accessRole.name',
        'vacation.cover.firstName',
        'vacation.cover.lastName',
        'manager.firstName',
        'manager.lastName',
        'createdBy.user.firstName',
        'createdBy.user.lastName',
        'country.name',
        'region.name',
        'subRegion.name',
        'outlet.name',
        'retailSegment.name',
        'branch.name'
    ],

    validate: function (attrs) {
        var errors = [];
        var tempEmployee = attrs.temp;
        var level = attrs.accessRoleLevel;
        var countryMandatory = level > 1 && level < 10 && level !== 8;
        var regionMandatory = level > 2 && level < 8;
        var subRegionMandatory = level > 3 && level < 8;
        var branchMandatory = level > 4 && level < 8;

        if (tempEmployee) {
            if (this.translatedFields.firstName) {
                validation.checkTitleField(errors, true, attrs.firstName, this.translatedFields.firstName);
            }
            if (this.translatedFields.lastName) {
                validation.checkTitleField(errors, true, attrs.lastName, this.translatedFields.lastName);
            }
            if (this.translatedFields.phoneNumber) {
                validation.checkPhoneField(errors, true, attrs.phoneNumber, this.translatedFields.phoneNumber);
            }
        }

        if (!tempEmployee) {
            if (this.translatedFields.firstName) {
                validation.checkTitleField(errors, true, attrs.firstName, this.translatedFields.firstName);
            }
            if (this.translatedFields.lastName) {
                validation.checkTitleField(errors, true, attrs.lastName, this.translatedFields.lastName);
            }
            if (this.translatedFields.phoneNumber) {
                validation.checkPhoneField(errors, true, attrs.phoneNumber, this.translatedFields.phoneNumber);
            }
            /*if (this.translatedFields.email) {
                validation.checkEmailField(errors, true, attrs.email, this.translatedFields.email);
            }*/
            if (this.translatedFields.accessRole) {
                validation.checkForValuePresence(errors, !tempEmployee, attrs.accessRole, this.translatedFields.accessRole);
            }
            if (this.translatedFields.position) {
                validation.checkForValuePresence(errors, !tempEmployee, attrs.position, this.translatedFields.position);
            }
            if (this.translatedFields.country) {
                validation.checkForValuePresence(errors, countryMandatory, attrs.country, this.translatedFields.country);
            }
            if (this.translatedFields.region) {
                validation.checkForValuePresence(errors, regionMandatory, attrs.region, this.translatedFields.region);
            }
            if (this.translatedFields.subRegion) {
                validation.checkForValuePresence(errors, subRegionMandatory, attrs.subRegion, this.translatedFields.subRegion);
            }
            if (this.translatedFields.branch) {
                validation.checkForValuePresence(errors, branchMandatory, attrs.branch, this.translatedFields.branch);
            }
        }

        if (errors.length > 0) {
            return errors;
        }
    },

    urlRoot: function () {
        return CONTENT_TYPES.PERSONNEL;
    }
});
