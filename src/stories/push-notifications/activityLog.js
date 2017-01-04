const events = require('events');
const activityLog = new events.EventEmitter();

activityLog.on('objective:draft-created', require('./methods/objective/draftCreated'));

activityLog.on('in-store-task:draft-created', require('./methods/inStoreTask/draftCreated'));

module.exports = activityLog;
