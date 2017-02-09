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
activityLog.on('objective:distribution-form:updated', require('./methods/objective/distributionFormUpdated'));

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
activityLog.on('in-store-task:distribution-form:updated', require('./methods/inStoreTask/distributionFormUpdated'));

activityLog.on('personnel:created', require('./methods/personnel/created'));
activityLog.on('personnel:updated', require('./methods/personnel/updated'));
activityLog.on('personnel:on-leave', require('./methods/personnel/onLeave'));
activityLog.on('personnel:cover', require('./methods/personnel/cover'));
activityLog.on('personnel:assigned', require('./methods/personnel/assigned'));
activityLog.on('personnel:bi-yearly', require('./methods/personnel/evaluatedYearly'));
activityLog.on('personnel:monthly', require('./methods/personnel/evaluated'));
activityLog.on('personnel:archived', require('./methods/personnel/archived'));

activityLog.on('country:created', require('./methods/locations/createdCountry'));
activityLog.on('country:updated', require('./methods/locations/editedCountry'));
activityLog.on('region:created', require('./methods/locations/createdRegion'));
activityLog.on('region:updated', require('./methods/locations/editedRegion'));
activityLog.on('sub-region:created', require('./methods/locations/createdSubRegion'));
activityLog.on('sub-region:updated', require('./methods/locations/editedSubRegion'));
activityLog.on('branch:created', require('./methods/locations/createdBranch'));
activityLog.on('branch:edited', require('./methods/locations/editedBranch'));
activityLog.on('trade-channel:created', require('./methods/locations/createdTradeChannel'));
activityLog.on('trade-channel:edited', require('./methods/locations/editedTradeChannel'));
activityLog.on('branch:removed', require('./methods/locations/removedBranch'));
activityLog.on('customer:created', require('./methods/locations/createdCustomer'));
activityLog.on('customer:edited', require('./methods/locations/editedCustomer'));

activityLog.on('sub-region:removed', require('./methods/locations/removedSubRegion'));
activityLog.on('trade-channel:removed', require('./methods/locations/removedRegion'));
activityLog.on('country:removed', require('./methods/locations/removedCountry'));

activityLog.on('reporting:price-survey:published', require('./methods/reporting/price-survey/published'));
activityLog.on('reporting:shelf-share:published', require('./methods/reporting/shelf-share/published'));
activityLog.on('reporting:competitor-branding-and-display-report:published', require('./methods/reporting/competitor-branding-and-display-report/published'));
activityLog.on('reporting:competitor-branding-and-display-report:expired', require('./methods/reporting/competitor-branding-and-display-report/expired'));
activityLog.on('reporting:competitor-promotion-activities:published', require('./methods/reporting/competitor-promotion-activities/published'));
activityLog.on('reporting:competitor-promotion-activities:expired', require('./methods/reporting/competitor-promotion-activities/expired'));
activityLog.on('reporting:new-product-launch:published', require('./methods/reporting/new-product-launch/published'));
activityLog.on('reporting:achievement-form:published', require('./methods/reporting/achievement-form/published'));

activityLog.on('reporting:al-alali-promo-evaluation:draft-created', require('./methods/reporting/al-alali-promo-evaluation/draftCreated'));
activityLog.on('reporting:al-alali-promo-evaluation:published', require('./methods/reporting/al-alali-promo-evaluation/published'));
activityLog.on('reporting:al-alali-promo-evaluation:updated', require('./methods/reporting/al-alali-promo-evaluation/updated'));
activityLog.on('reporting:al-alali-promo-evaluation:expired', require('./methods/reporting/al-alali-promo-evaluation/expired'));
activityLog.on('reporting:al-alali-promo-evaluation:item-published', require('./methods/reporting/al-alali-promo-evaluation/itemPublished'));
activityLog.on('reporting:al-alali-promo-evaluation:item-expired', require('./methods/reporting/al-alali-promo-evaluation/itemExpired'));

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

activityLog.on('items-and-prices:item-published', require('./methods/itemsAndPrices/itemCreated'));
activityLog.on('items-and-prices:item-updated', require('./methods/itemsAndPrices/itemUpdated'));
activityLog.on('items-and-prices:item-archived', require('./methods/itemsAndPrices/itemArchived'));
activityLog.on('items-and-prices:item-unarchived', require('./methods/itemsAndPrices/itemUnarchived'));

activityLog.on('planogram:published', require('./methods/planograms/created'));
activityLog.on('planogram:updated', require('./methods/planograms/updated'));
activityLog.on('planogram:archived', require('./methods/planograms/archived'));
activityLog.on('planogram:unarchived', require('./methods/planograms/unarchived'));

module.exports = activityLog;
