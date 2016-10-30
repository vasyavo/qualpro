define([
        'Underscore',
        'models/parrent',
        'custom',
        'constants/otherConstants',
        'constants/contentType'
    ],
    function (_, parent, custom, CONSTANTS, CONTENT_TYPES) {
        var Model = parent.extend({
            defaults      : {},
            attachmentsKey: 'comment.attachments',

            multilanguageFields: [
                'branches.comment.createdBy.user.firstName',
                'branches.comment.createdBy.user.lastName',
                'branches.comment.editedBy.user.firstName',
                'branches.comment.editedBy.user.lastName',
                'name',
                'branches.name',
                'branches.displayType.name'
            ],

            validate: function () {
                var errors = [];

                if (errors.length > 0) {
                    return errors;
                }
            },

            urlRoot: function () {
                return CONTENT_TYPES.PROMOTIONSITEMS;
            },

            modelParse: function (model) {
                var currentLanguage = App.currentUser.currentLanguage;

                var statuses = CONSTANTS.PROMOTION_UI_STATUSES;

                model.branches.forEach(function (branch) {
                    var status = _.findWhere(statuses, {_id: branch.status});

                    if (branch.dateStart) {
                        branch.dateStart = custom.dateFormater('DD.MM.YYYY', branch.dateStart);
                    }

                    if (branch.dateEnd) {
                        branch.dateEnd = custom.dateFormater('DD.MM.YYYY', branch.dateEnd);
                    }

                    branch.status = status.name[currentLanguage];
                });

                return model;
            }
        });

        return Model;
    });
