define([
    'models/parrent',
    'validation',
    'constants/contentType',
    'constants/otherConstants'
], function (parent, validation, CONTENT_TYPES, CONSTANTS) {
    var Model = parent.extend({
        defaults      : {},
        attachmentsKey: 'attachments',

        multilanguageFields: [
            'title',
            'description',
            'createdBy.user.firstName',
            'createdBy.user.lastName',
            'createdBy.user.accessRole.name',
            'createdBy.user.position.name',
            'assignedTo.firstName',
            'assignedTo.lastName',
            'history.assignedTo.firstName',
            'history.assignedTo.lastName',
            'history.assignedTo.accessRole.name',
            'history.assignedTo.position.name'
        ],

        urlRoot   : function () {
            return CONTENT_TYPES.INSTORETASKS + '/taskFlow/';
        },
        modelParse: function (model) {
            var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
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
            return model;
        }
    });

    return Model;
});
