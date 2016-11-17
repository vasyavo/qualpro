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
            'title',
            'type',
            'assignTo',
            'priority',
            'location',
            'startDate',
            'endDate',
            'description'
        ],

        multilanguageFields: [
            'title',
            'companyObjective',
            'description',
            'createdBy.user.firstName',
            'createdBy.user.lastName',
            'createdBy.user.accessRole.name',
            'createdBy.user.position.name',
            'assignedTo.firstName',
            'assignedTo.lastName',
            'assignedTo.position.name',
            'branch.name',
            //for flowTree
            'subTasks.title',
            'subTasks.companyObjective',
            'subTasks.description',
            'subTasks.createdBy.user.firstName',
            'subTasks.createdBy.user.lastName',
            'subTasks.createdBy.user.accessRole.name',
            'subTasks.createdBy.user.position.name',
            'subTasks.assignedTo.firstName',
            'subTasks.assignedTo.lastName',
            'subTasks.assignedTo.accessRole.name',
            'subTasks.assignedTo.position.name'
        ],

        validate: function (attrs, cb) {
            var errors = [];

            if (this.translatedFields.title) {
                validation.checkTitleField(errors, true, attrs.title, this.translatedFields.title);
            }
            if (this.translatedFields.type) {
                validation.checkForValuePresence(errors, true, attrs.objectiveType, this.translatedFields.type);
            }
            if (this.translatedFields.assignTo) {
                validation.checkForValuePresence(errors, true, attrs.assignedTo, this.translatedFields.assignTo);
            }
            if (this.translatedFields.priority) {
                validation.checkForValuePresence(errors, true, attrs.priority, this.translatedFields.priority);
            }
            if (this.translatedFields.location) {
                validation.checkForValuePresence(errors, true, attrs.location, this.translatedFields.location);
            }
            if (this.translatedFields.startDate) {
                validation.checkForValuePresence(errors, true, attrs.dateStart, this.translatedFields.startDate);
            }
            if (this.translatedFields.endDate) {
                validation.checkForValuePresence(errors, true, attrs.dateEnd, this.translatedFields.endDate);
            }
            if (this.translatedFields.description) {
                validation.checkDescriptionField(errors, true, attrs.description, this.translatedFields.description);
            }

            if (errors.length > 0) {
                if (!cb.parse) {
                    return cb(errors);
                }
                return errors;
            }
            if (!cb.parse) {
                return cb(null);
            }
        },

        modelMapper: function (key, model, currentLanguage) {
            return model[key] ? _.map(model[key], function (el) {
                return el.name[currentLanguage] || ' ';
            }).join(', ') : ' ';
        },

        urlRoot   : function () {
            return CONTENT_TYPES.OBJECTIVES;
        },
        modelParse: function (model) {
            var location = [];
            var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
            var countryString = this.modelMapper('country', model, currentLanguage);
            var regionString = this.modelMapper('region', model, currentLanguage);
            var subRegionString = this.modelMapper('subRegion', model, currentLanguage);
            var retailSegmentString = this.modelMapper('retailSegment', model, currentLanguage);
            var outletString = this.modelMapper('outlet', model, currentLanguage);
            var branchString = this.modelMapper('branch', model, currentLanguage);
            countryString ? location.push(countryString) : '';
            regionString ? location.push(regionString) : '';
            subRegionString ? location.push(subRegionString) : '';
            retailSegmentString ? location.push(retailSegmentString) : '';
            outletString ? location.push(outletString) : '';
            branchString ? location.push(branchString) : '';
            model.location = location.join(' > ');

            _.map(CONSTANTS.OBJECTIVESTATUSES_FOR_UI, function (status) {
                if (status._id === model.status) {
                    model.status = status;
                    model.status.name.currentLanguage = status.name[currentLanguage];
                }
            });

            _.map(CONSTANTS.OBJECTIVES_PRIORITY, function (priority) {
                if (priority._id === model.priority) {
                    model.priority = priority;
                    model.priority.name.currentLanguage = priority.name[currentLanguage];
                }
            });

            if (model.subTasks && model.subTasks.length) {
                _.map(model.subTasks, function (subTask) {
                    _.map(CONSTANTS.OBJECTIVESTATUSES_FOR_UI, function (status) {
                        if (status._id === subTask.status) {
                            subTask.status = status;
                            subTask.status.name.currentLanguage = status.name[currentLanguage];
                        }
                    });
                    _.map(CONSTANTS.OBJECTIVES_PRIORITY, function (priority) {
                        if (priority._id === subTask.priority) {
                            subTask.priority = priority;
                            subTask.priority.name.currentLanguage = priority.name[currentLanguage];
                        }
                    });
                });
            }

            return model;
        }
    });

    return Model;
});
