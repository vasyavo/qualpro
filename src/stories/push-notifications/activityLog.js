const events = require('events');
const activityLog = new events.EventEmitter();

activityLog.on('objective:draft-created', require('./methods/objective/draftCreated'));
activityLog.on('objective:published', require('./methods/objective/published'));

activityLog.on('objective:updated', require('./methods/objective/updated'));
activityLog.on('objective:status-updated', require('./methods/objective/updated')); // todo: change event handler
activityLog.on('objective:reassigned', require('./methods/objective/updated')); // todo: change event handler
activityLog.on('objective:comment-added', require('./methods/objective/commentAdded'));
activityLog.on('objective:overdue', require('./methods/objective/overdue'));
activityLog.on('objective:fail', require('./methods/objective/fail'));

activityLog.on('sub-objective:draft-created', require('./methods/objective/sub/draftCreated'));
activityLog.on('sub-objective:published', require('./methods/objective/sub/published'));

activityLog.on('in-store-task:draft-created', require('./methods/inStoreTask/draftCreated'));
activityLog.on('in-store-task:published', require('./methods/inStoreTask/published'));

activityLog.on('in-store-task:updated', require('./methods/inStoreTask/updated'));
activityLog.on('in-store-task:status-updated', require('./methods/inStoreTask/updated')); // todo: change event handler
activityLog.on('in-store-task:reassigned', require('./methods/inStoreTask/updated')); // todo: change event handler
activityLog.on('in-store-task:comment-added', require('./methods/inStoreTask/commentAdded'));
activityLog.on('in-store-task:overdue', require('./methods/inStoreTask/overdue'));
activityLog.on('in-store-task:fail', require('./methods/inStoreTask/fail'));

activityLog.on('reporting:price-survey:published', require('./methods/reporting/price-survey/published'));
activityLog.on('reporting:shelf-share:published', require('./methods/reporting/shelf-share/published'));
activityLog.on('reporting:competitor-branding-and-display-report:published', require('./methods/reporting/competitor-branding-and-display-report/published'));
activityLog.on('reporting:competitor-promotion-activities:published', require('./methods/reporting/competitor-promotion-activities/published'));
activityLog.on('reporting:new-product-launch:published', require('./methods/reporting/new-product-launch/published'));
activityLog.on('reporting:achievement-form:published', require('./methods/reporting/achievement-form/published'));

activityLog.on('reporting:al-alali-promo-evaluation:draft-created', require('./methods/reporting/al-alali-promo-evaluation/draftCreated'));
activityLog.on('reporting:al-alali-promo-evaluation:published', require('./methods/reporting/al-alali-promo-evaluation/published'));
activityLog.on('reporting:al-alali-promo-evaluation:updated', require('./methods/reporting/al-alali-promo-evaluation/updated'));
activityLog.on('reporting:al-alali-promo-evaluation:item-published', require('./methods/reporting/al-alali-promo-evaluation/itemPublished'));

activityLog.on('marketing:al-alali-branding-and-display-report:published', require('./methods/marketing/al-alali-branding-and-display-report/published'));

activityLog.on('marketing:al-alali-marketing-campaigns:draft-created', require('./methods/marketing/al-alali-marketing-campaigns/draftCreated'));
activityLog.on('marketing:al-alali-marketing-campaigns:published', require('./methods/marketing/al-alali-marketing-campaigns/published'));
activityLog.on('marketing:al-alali-marketing-campaigns:updated', require('./methods/marketing/al-alali-marketing-campaigns/updated'));
activityLog.on('marketing:al-alali-marketing-campaigns:expired', require('./methods/marketing/al-alali-marketing-campaigns/expired'));
activityLog.on('marketing:al-alali-marketing-campaigns:item-published', require('./methods/marketing/al-alali-marketing-campaigns/itemPublished'));

activityLog.on('marketing:al-alali-questionnaire:draft-created', require('./methods/marketing/al-alali-questionnaire/draftCreated'));
activityLog.on('marketing:al-alali-questionnaire:published', require('./methods/marketing/al-alali-questionnaire/published'));
activityLog.on('marketing:al-alali-questionnaire:updated', require('./methods/marketing/al-alali-questionnaire/updated'));
activityLog.on('marketing:al-alali-questionnaire:expired', require('./methods/marketing/al-alali-questionnaire/expired'));
activityLog.on('marketing:al-alali-questionnaire:item-published', require('./methods/marketing/al-alali-questionnaire/itemPublished'));

activityLog.on('marketing:consumer-survey:draft-created', require('./methods/marketing/consumer-survey/draftCreated'));
activityLog.on('marketing:consumer-survey:published', require('./methods/marketing/consumer-survey/published'));
activityLog.on('marketing:consumer-survey:updated', require('./methods/marketing/consumer-survey/updated'));
activityLog.on('marketing:consumer-survey:expired', require('./methods/marketing/consumer-survey/expired'));
activityLog.on('marketing:consumer-survey:item-published', require('./methods/marketing/consumer-survey/itemPublished'));

module.exports = activityLog;
