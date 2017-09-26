var _ = require('underscore');
var otherConstants = require('../constants/otherConstants');
var App = require('../appState');

var STATUSES = otherConstants.OBJECTIVE_STATUSES;

var checkStatus = function (status, createdByUser, currentStatus) {
    var coveredIds = App.currentUser.covered ? Object.keys(App.currentUser.covered) : [];
    var currentUser = createdByUser._id === App.currentUser._id || coveredIds.indexOf(createdByUser._id) !== -1;

    if (status._id === STATUSES.CLOSED && currentStatus !== STATUSES.CLOSED && !currentUser) {
        return false;
    }

    return status;
};

module.exports = function (objectiveModel) {
    var currentStatus = objectiveModel.status._id;
    var allowedStatuses = otherConstants.OBJECTIVE_STATUSES_FLOW[currentStatus];
    var createdByUser = objectiveModel.createdBy && objectiveModel.createdBy.user ? objectiveModel.createdBy.user : '';

    allowedStatuses = _.map(allowedStatuses, function (status) {
        return checkStatus(status, createdByUser, currentStatus);
    });

    return _.compact(allowedStatuses);
};
