define(
    [
        'underscore',
        'constants/otherConstants'
    ],
function (_, otherConstants) {
    var STATUSES = otherConstants.OBJECTIVE_STATUSES;

    var checkStatus = function (status, createdByUser, currentStatus) {
        var currentUser = createdByUser._id === App.currentUser._id;

        if (status._id === STATUSES.CLOSED && currentStatus !== STATUSES.CLOSED && !currentUser) {
            return false;
        }

        return status;
    };

    return function (objectiveModel) {
        var currentStatus = objectiveModel.status._id;
        var allowedStatuses = otherConstants.OBJECTIVE_STATUSES_FLOW[currentStatus];
        var createdByUser = objectiveModel.createdBy && objectiveModel.createdBy.user ? objectiveModel.createdBy.user : '';

        allowedStatuses = _.map(allowedStatuses, function (status) {
            return checkStatus(status, createdByUser, currentStatus);
        });

        return _.compact(allowedStatuses);

    };
});