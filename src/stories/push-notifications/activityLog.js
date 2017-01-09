const events = require('events');
const activityLog = new events.EventEmitter();

activityLog.on('objective:draft-created', require('./methods/objective/draftCreated'));
activityLog.on('objective:published', require('./methods/objective/published'));

activityLog.on('objective:updated', require('./methods/objective/updated'));
activityLog.on('objective:status-updated', require('./methods/objective/updated')); // todo: change event handler
activityLog.on('objective:reassigned', require('./methods/objective/updated')); // todo: change event handler

activityLog.on('sub-objective:draft-created', require('./methods/objective/sub/draftCreated'));
activityLog.on('sub-objective:published', require('./methods/objective/sub/published'));

activityLog.on('in-store-task:draft-created', require('./methods/inStoreTask/draftCreated'));
activityLog.on('in-store-task:published', require('./methods/inStoreTask/published'));

activityLog.on('in-store-task:updated', require('./methods/inStoreTask/updated'));
activityLog.on('in-store-task:status-updated', require('./methods/inStoreTask/updated')); // todo: change event handler
activityLog.on('in-store-task:reassigned', require('./methods/inStoreTask/updated')); // todo: change event handler

module.exports = activityLog;
