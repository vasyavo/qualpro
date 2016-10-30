var activityHelper = require('../helpers/activity');
var personnelHelper = require('../helpers/personnel');
var notificationHelper = require('../helpers/notification');

module.exports = function (db, redis, event, app) {

    var activity = new activityHelper(db, redis, app);
    var personnel = new personnelHelper(db, redis, app);
    var notification = new notificationHelper(db, redis, app);

    event.on('activityChange', function (options) {

        options = options || {};

        activity.addObject(options, function () {
        });
    });
    event.on('notOnLeave', function (options) {

        options = options || {};

        personnel.sendObject(options, function () {
        });
    });
    event.on('notificationChange', function (options) {

        options = options || {};

        notification.sendObject(options, function () {
        });
    });
};
