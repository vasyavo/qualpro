const events = require('events');
const activityLog = new events.EventEmitter();

activityLog.on('objective:draft-created', require('./methods/objective/draftCreated'));
activityLog.on('objective:published', require('./methods/objective/published'));

activityLog.on('objective:updated', require('./methods/objective/updated'));
activityLog.on('objective:status-updated', require('./methods/objective/updated')); // todo: change event handler
activityLog.on('objective:reassigned', require('./methods/objective/updated')); // todo: change event handler
activityLog.on('objective:comment-added', require('./methods/objective/commentAdded'));

activityLog.on('sub-objective:draft-created', require('./methods/objective/sub/draftCreated'));
activityLog.on('sub-objective:published', require('./methods/objective/sub/published'));

activityLog.on('in-store-task:draft-created', require('./methods/inStoreTask/draftCreated'));
activityLog.on('in-store-task:published', require('./methods/inStoreTask/published'));

activityLog.on('in-store-task:updated', require('./methods/inStoreTask/updated'));
activityLog.on('in-store-task:status-updated', require('./methods/inStoreTask/updated')); // todo: change event handler
activityLog.on('in-store-task:reassigned', require('./methods/inStoreTask/updated')); // todo: change event handler
activityLog.on('in-store-task:comment-added', require('./methods/inStoreTask/commentAdded'));

activityLog.on('reporting:price-survey:published', require('./methods/reporting/price-survey/published'));
activityLog.on('reporting:shelf-share:published', require('./methods/reporting/shelf-share/published'));
activityLog.on('reporting:competitor-branding-and-display-report:published', require('./methods/reporting/competitor-branding-and-display-report/published'));
activityLog.on('reporting:competitor-promotion-activities:published', require('./methods/reporting/competitor-promotion-activities/published'));
activityLog.on('reporting:new-product-launch:published', require('./methods/reporting/new-product-launch/published'));

module.exports = activityLog;
