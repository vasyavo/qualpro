const CONTENT_TYPES = require('../public/js/constants/contentType');

const models = {};

models[CONTENT_TYPES.ACCESSROLE] = require('./accessRole/model');
models[CONTENT_TYPES.ACTIVITYLIST] = require('./activityList/model');
models[CONTENT_TYPES.BIYEARLY] = require('./biYearly/model');
models[CONTENT_TYPES.BRANCH] = require('./branch/model');
models[CONTENT_TYPES.BRAND] = require('./brand/model');
models[CONTENT_TYPES.BRANDING_ACTIVITY] = require('./brandingActivity/model');
models[CONTENT_TYPES.BRANDING_ACTIVITY_ITEMS] = require('./brandingActivityItem/model');
models[CONTENT_TYPES.BRANDINGANDDISPLAY] = require('./brandingAndDisplay/model');
models[CONTENT_TYPES.CATEGORY] = require('./category/model');
models[CONTENT_TYPES.COMMENT] = require('./comment/model');
models[CONTENT_TYPES.COMPETITORBRANDING] = require('./competitorBranding/model');
models[CONTENT_TYPES.COMPETITORITEM] = require('./competitorItem/model');
models[CONTENT_TYPES.COMPETITORPROMOTION] = require('./competitorPromotion/model');
models[CONTENT_TYPES.COMPETITORVARIANT] = require('./competitorVariant/model');
models[CONTENT_TYPES.CONSUMER_SURVEY] = require('./consumerSurvey/model');
models[CONTENT_TYPES.CONTACT_US] = require('./contactUs/model');
models[CONTENT_TYPES.CONTRACTSSECONDARY] = require('./contractSecondary/model');
models[CONTENT_TYPES.CONTRACTSYEARLY] = require('./contractYearly/model');
models[CONTENT_TYPES.CURRENCY] = require('./currency/model');
models[CONTENT_TYPES.DISPLAYTYPE] = require('./displayType/model');
models[CONTENT_TYPES.DISTRIBUTIONFORM] = require('./distributionForm/model');
models[CONTENT_TYPES.DOCUMENTS] = require('./document/model');
models[CONTENT_TYPES.DOMAIN] = require('./domain/model');
models[CONTENT_TYPES.FILES] = require('./file/model');
models[CONTENT_TYPES.INSTORETASKS] = require('./objective/model');
models[CONTENT_TYPES.ITEM] = require('./item/model');
models[CONTENT_TYPES.ITEMHISTORY] = require('./itemHistory/model');
models[CONTENT_TYPES.MODULE] = require('./module/model');
models[CONTENT_TYPES.MONTHLY] = require('./monthly/model');
models[CONTENT_TYPES.NEWPRODUCTLAUNCH] = require('./newProductLaunch/model');
models[CONTENT_TYPES.NOTES] = require('./note/model');
models[CONTENT_TYPES.NOTIFICATIONS] = require('./notification/model');
models[CONTENT_TYPES.OBJECTIVES] = require('./objective/model');
models[CONTENT_TYPES.OBJECTIVEHISTORY] = require('./objectiveHistory/model');
models[CONTENT_TYPES.ORIGIN] = require('./origin/model');
models[CONTENT_TYPES.OUTLET] = require('./outlet/model');
models[CONTENT_TYPES.PERSONNEL] = require('./personnel/model');
models[CONTENT_TYPES.PERSONNELANSWERS] = require('./personnelAnswers/model');
models[CONTENT_TYPES.PLANOGRAM] = require('./planogram/model');
models[CONTENT_TYPES.POSITION] = require('./position/model');
models[CONTENT_TYPES.PRICESURVEY] = require('./priceSurvey/model');
models[CONTENT_TYPES.PRIORITY] = require('./priority/model');
models[CONTENT_TYPES.PROMOTIONS] = require('./promotion/model');
models[CONTENT_TYPES.PROMOTIONSITEMS] = require('./promotionItem/model');
models[CONTENT_TYPES.QUESTIONNARIES] = require('./questionnaries/model');
models[CONTENT_TYPES.QUESTIONNARIES_ANSWER] = require('./questionnariesAnswer/model');
models[CONTENT_TYPES.RETAILSEGMENT] = require('./retailSegment/model');
models[CONTENT_TYPES.SESSION] = require('./session/model');
models[CONTENT_TYPES.SHELF] = require('./shelf/model');
models[CONTENT_TYPES.SHELFSHARES] = require('./shelfShare/model');
models[CONTENT_TYPES.VARIANT] = require('./variant/model');
models[CONTENT_TYPES.VISIBILITYFORM] = require('./visibilityForm/model');
models[CONTENT_TYPES.ACHIEVEMENTFORM] = require('./achievementForm/model');

module.exports = models;
