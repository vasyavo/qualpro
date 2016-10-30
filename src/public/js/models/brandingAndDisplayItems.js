define([
    'Underscore',
    'models/parrent',
    'custom',
    'constants/otherConstants',
    'constants/contentType'
], function (_, parent, custom, CONSTANTS, CONTENT_TYPES) {
    var Model = parent.extend({
        defaults      : {},
        attachmentsKey: 'comment.attachments',

        multilanguageFields: [
            'name',
            'branches.branch.name',
            'branches.createdBy.user.lastName',
            'branches.createdBy.user.firstName',
            'branches.comment.createdBy.user.firstName',
            'branches.comment.createdBy.user.lastName',
            'branches.comment.editedBy.user.firstName',
            'branches.comment.editedBy.user.lastName'
        ],

        validate: function () {
            var errors = [];

            if (errors.length > 0) {
                return errors;
            }
        },

        urlRoot: function () {
            return CONTENT_TYPES.BRANDINGANDDISPLAYITEMS;
        }
    });

    return Model;
});
