define([
        'models/parrent',
        'validation',
        'custom',
        'constants/otherConstants',
        'constants/contentType',
        'constants/errorMessages',
        'dataService',
    ],
    function (parent, validation, custom, CONSTANTS, CONTENT_TYPES, ERROR_MESSAGES, dataService) {
        var Model = parent.extend({
            defaults      : {},
            attachmentsKey: 'attachments',

            multilanguageFields: [
                'description',
                'location',
                'createdBy.user.firstName',
                'createdBy.user.lastName',
                'createdBy.user.accessRole.name',
                'createdBy.user.position.name',
                'category.name',
                'brand.name',
                'country.name',
                'region.name',
                'subRegion.name',
                'retailSegment.name',
                'outlet.name',
                'branch.name',
                'displayType.name'
            ],

            validate: function (attrs) {
                var errors = [];

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.BRANDING_AND_MONTHLY_DISPLAY;
            },

            modelMapper: function (key, model) {
                return model[key] ? _.map(model[key], function (el) {
                    return el.name.currentLanguage || ' ';
                }).join(', ') : ' ';
            },

            modelParse: function (model) {
                let location = [];

                model.countryString = model.countries ? model.countries.name[App.currentUser.currentLanguage] : '';
                location.push(model.countryString);

                model.regionString = model.region ? model.region.name.currentLanguage : '';
                location.push(model.regionString);

                model.subRegionString = model.subRegion ? model.subRegion.name[App.currentUser.currentLanguage] : '';
                location.push(model.subRegionString);

                //model.retailSegmentString = model.retailSegment ? model.retailSegment.name.currentLanguage : '';
                //location.push(model.retailSegmentString);

                model.outletString = model.outlet ? model.outlet.name.currentLanguage : '';
                location.push(model.outletString);

                model.branchString = model.branch ? model.branch.name.currentLanguage : '';
                location.push(model.branchString);

                model.categoryString = this.modelMapper('categories', model);
                model.displayTypeString = model.displayType.map((model) => {
                    return model.name.currentLanguage;
                }).join(', ');

                model.location = location.filter(function (value) {
                    return value;
                }).join(' > ');
            },

            edit: function (brandingAndMonthlyDisplay, data) {
                var that = this;
                var currentLanguage = App.currentUser.currentLanguage;

                dataService.putData('/brandingAndMonthlyDisplay/' + brandingAndMonthlyDisplay, data, function (err, response) {
                    if (err) {
                        return App.renderErrors([
                            err.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                        ]);
                    }

                    that.trigger('branding-and-monthly-display-edited', response);
                });
            }
        });

        return Model;
    });
