const expect = require('chai').expect;
const async = require('async');

const assertGetResponse = (body) => {
    expect(body).to.be.an('Object')
        .and.include.all.keys(['data', 'total', 'lastSyncDate']);
    expect(body.data).to.be.an('Array');
    expect(body.total).to.be.a('Number');
    expect(body.lastSyncDate).to.be.a('String');
};

/*
 * SYNC SCENARIO V1
 * BEGIN:
 *  - activity
 *  - location
 *  - personnel
 *  - objective
 *  - in store
 *  - price survey
 *  - shelf share
 *  - competitor promo activity
 *  - competitor display report
 *  - achievement form
 *  - new product launch
 * IF [Cash Van, Merchandiser, Salesman] :
 *  - alalai promo evaluation
 *  - branding display report
 *  - questionnaire
 * THEN:
 *  - planogram
 *  - item prices
 *  - category
 *  - competitors
 * IF [Master Admin, Country Admin, Area Manager, Area in Charge Manager, Salesman]:
 *  - contract yearly
 *  - contract secondary
 * IF [Merchandiser]:
 *  - contract yearly
 * THEN:
 *  - document
 *  - note
 *  - notification
 *  - all meta
 *
 * */

/*
 * GET SCENARIO V1
 * - activity list
 * - domain
 * - retail segment
 * - outlet
 * - branch
 * - personnel
 * - objectives
 * - in store tasks
 * - planogram
 * - item prices
 * - category
 * - competitor:
 *  - brand - ??? @GET("mobile/brand")
 *  - item - ??? @GET("mobile/competitorItem")
 *  - variant - ??? @GET("mobile/competitorVariant")
 * - documents
 * - contract yearly
 * - contract secondary
 * - al alai promo evaluation - "/mobile/promotionsItems/"
 * - competitor promo activity - "/mobile/competitorPromotion"
 * - shelf share
 * - price survey
 * - new product launch
 * - branding activity - ???
 * - branding display report - ???"/mobile/brandingAndDisplay"
 * - competitor display report - "/mobile/competitorBranding"
 * - achievement form
 * - questionnary
 * - notifications
 * - note
 * - origin ???
 * - access roles
 * - all meta:
 *  - "mobile/position/getForDD"
 *  - "mobile/displayType"
 *  - origin again ???
 * */

function shouldGetActivityList(agent) {
    it('should get activity list', function *() {
        const resp = yield agent
            .get('/mobile/activityList')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncActivityList(agent) {
    it('should sync activity list', function *() {
        const resp = yield agent
            .get('/mobile/activityList/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetLocation(agent) {
    it('should get location', function *() {
        const resp = yield agent
            .get('/mobile/domain')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncLocation(agent) {
    it('should sync location', function *() {
        const resp = yield agent
            .get('/mobile/domain/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetPersonnel(agent) {
    it('should get personnel', function *() {
        const resp = yield agent
            .get('/mobile/personnel')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncPersonnel(agent) {
    it('should sync personnel', function *() {
        const resp = yield agent
            .get('/mobile/personnel/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetObjectives(agent) {
    it('should get objectives', function *() {
        const resp = yield agent
            .get('/mobile/objectives')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncObjectives(agent) {
    it('should sync objectives', function *() {
        const resp = yield agent
            .get('/mobile/objectives/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetInStoreTasks(agent) {
    it('should get in store tasks', function *() {
        const resp = yield agent
            .get('/mobile/instoretasks')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncInStoreTasks(agent) {
    it('should sync in store tasks', function *() {
        const resp = yield agent
            .get('/mobile/instoretasks/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetPriceSurvey(agent) {
    it('should get price survey list', function *() {
        const resp = yield agent
            .get('/mobile/priceSurvey')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncPriceSurvey(agent) {
    it('should sync price survey', function *() {
        const resp = yield agent
            .get('/mobile/priceSurvey/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetShelfShare(agent) { //todo no such route
    xit('should get shelf share list', function *() {
        const resp = yield agent
            .get('/mobile/shelfShares')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncShelfShare(agent) {
    it('should sync shelf share', function *() {
        const resp = yield agent
            .get('/mobile/shelfShares/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetPromotions(agent) {
    it('should get promotions', function *() {
        const resp = yield agent
            .get('/mobile/promotions')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncPromotions(agent) {
    it('should sync promotions', function *() {
        const resp = yield agent
            .get('/mobile/promotions/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetCurrentUser(agent) {
    it('should get current user', function *() {
        const resp = yield agent
            .get('/mobile/personnel/currentUser')
            .expect(200);

        const user = resp.body;

        expect(user).to.be.an('Object');
        expect(user).to.have.property('_id');
    });
}

function shouldGetContractYearly(agent) {
    it('should get contract yearly', function *() {
        const resp = yield agent
            .get('/mobile/contractsYearly')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncContractYearly(agent) {
    it('should sync contract yearly', function *() {
        const resp = yield agent
            .get('/mobile/contractsYearly/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetContractSecondary(agent) {
    it('should get contract secondary', function *() {
        const resp = yield agent
            .get('/mobile/contractsSecondary')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncContractSecondary(agent) {
    it('should sync contract secondary', function *() {
        const resp = yield agent
            .get('/mobile/contractsSecondary/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetRetailSegment(agent) {
    it('should get retail segment', function *() {
        const resp = yield agent
            .get('/mobile/retailSegment')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncRetailSegment(agent) {
    it('should sync retail segment', function *() {
        const resp = yield agent
            .get('/mobile/retailSegment/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetOutlet(agent) {
    it('should get outlet', function *() {
        const resp = yield agent
            .get('/mobile/outlet')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncOutlet(agent) {
    it('should sync outlet', function *() {
        const resp = yield agent
            .get('/mobile/outlet/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetBranch(agent) {
    it('should get branch', function *() {
        const resp = yield agent
            .get('/mobile/branch')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncBranch(agent) {
    it('should sync branch', function *() {
        const resp = yield agent
            .get('/mobile/branch/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetBrandingActivity(agent) {
    it('should get branding activity (in past branding and display)', function *() {
        const resp = yield agent
            .get('/mobile/marketingCampaign')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncBrandingActivity(agent) {
    it('should sync branding activity (in past branding and display)', function *() {
        const resp = yield agent
            .get('/mobile/marketingCampaign/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetAchievementForm(agent) {
    it('should get achievement form', function *() {
        const resp = yield agent
            .get('/mobile/achievementForm')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncAchievementForm(agent) {
    it('should sync achievement form', function *() {
        const resp = yield agent
            .get('/mobile/achievementForm/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetCompetitorDisplayReport(agent) {
    it('should get competitor display report', function *() {
        const resp = yield agent
            .get('/mobile/competitorBranding')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncCompetitorDisplayReport(agent) {
    it('should sync competitor display report', function *() {
        const resp = yield agent
            .get('/mobile/competitorBranding/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetBrandingAndDisplayReport(agent) { //todo no such route
    xit('should get branding and display report', function *() {
        const resp = yield agent
            .get('/mobile/brandingAndDisplay')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncBrandingAndDisplayReport(agent) {
    it('should sync branding and display report', function *() {
        const resp = yield agent
            .get('/mobile/brandingAndDisplay/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetNewProductLaunch(agent) {
    it('should get new product launch', function *() {
        const resp = yield agent
            .get('/mobile/newProductLaunch')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncNewProductLaunch(agent) {
    it('should sync new product launch', function *() {
        const resp = yield agent
            .get('/mobile/newProductLaunch/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetPlanogram(agent) {
    it('should get planogram', function *() {
        const resp = yield agent
            .get('/mobile/planogram')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncPlanogram(agent) {
    it('should sync planogram', function *() {
        const resp = yield agent
            .get('/mobile/planogram/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetItemPrices(agent) {
    xit('should get item prices', function *() {
        const resp = yield agent
            .get('/mobile/itemsPrices')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncItemPrices(agent) {
    it('should sync item prices', function *() {
        const resp = yield agent
            .get('/mobile/itemsPrices/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetDocuments(agent) {
    it('should get documents', function *() {
        const resp = yield agent
            .get('/mobile/documents')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncDocuments(agent) {
    it('should sync documents', function *() {
        const resp = yield agent
            .get('/mobile/documents/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetAlAlaliPromoEvaluation(agent) { //todo no such route
    xit('should get Al Alai promo evaluation', function *() {
        const resp = yield agent
            .get('/mobile/promotionsItems')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncAlAlaliPromoEvaluation(agent) {
    it('should sync Al Alai promo evaluation', function *() {
        const resp = yield agent
            .get('/mobile/promotionsItems/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetCompetitorPromoActivity(agent) {
    it('should get competitor promo activity', function *() {
        const resp = yield agent
            .get('/mobile/competitorPromotion/')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncCompetitorPromoActivity(agent) {
    it('should sync competitor promo activity', function *() {
        const resp = yield agent
            .get('/mobile/competitorPromotion/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetQuestionnary(agent) {
    it('should get questionnary', function *() {
        const resp = yield agent
            .get('/mobile/questionnary')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncQuestionnary(agent) {
    it('should sync questionnary', function *() {
        const resp = yield agent
            .get('/mobile/questionnary/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetNotifications(agent) {
    it('should get notifications', function *() {
        const resp = yield agent
            .get('/mobile/notifications/')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncNotifications(agent) {
    it('should sync questionnary', function *() {
        const resp = yield agent
            .get('/mobile/notifications/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetNotes(agent) { //todo such router does not mount to mobile router
    xit('should get notes', function *() {
        const resp = yield agent
            .get('/mobile/notes')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncNotes(agent) {
    it('should sync notes', function *() {
        const resp = yield agent
            .get('/mobile/notes/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetOrigins(agent) {
    it('should get origins', function *() {
        const resp = yield agent
            .get('/mobile/origin')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncOrigins(agent) {
    it('should sync origins', function *() {
        const resp = yield agent
            .get('/mobile/origin/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldGetAccessRoles(agent) {
    it('should get access roles', function *() {
        const resp = yield agent
            .get('/mobile/accessRole')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}
function shouldSyncAccessRoles(agent) {
    it('should sync access roles', function *() {
        const resp = yield agent
            .get('/mobile/accessRole/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function getAllMeta(agent) {
    it('should get position dropdown', function *() {
        const resp = yield agent
            .get('/mobile/position/getForDD')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });

    it('should get display type', function *() {
        const resp = yield agent
            .get('/mobile/displayType')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

const standardPack = [
    shouldGetActivityList,
    shouldGetLocation,
    shouldGetRetailSegment,
    shouldGetOutlet,
    shouldGetBranch,
    shouldGetPersonnel,
    shouldGetObjectives,
    shouldGetInStoreTasks,
    shouldGetPlanogram,
    shouldGetItemPrices,

    shouldGetDocuments,
    shouldGetContractYearly,
    shouldGetContractSecondary,

    shouldGetAlAlaliPromoEvaluation,
    shouldGetCompetitorPromoActivity,
    shouldGetShelfShare,
    shouldGetNewProductLaunch,

    shouldGetBrandingActivity,
    shouldGetBrandingAndDisplayReport,
    shouldGetCompetitorDisplayReport,
    shouldGetAchievementForm,
    shouldGetQuestionnary,
    shouldGetNotifications,
    shouldGetNotes,
    shouldGetOrigins,
    shouldGetAccessRoles,
];

const merchandiserPack = [
    shouldGetActivityList,
    shouldGetLocation,
    shouldGetRetailSegment,
    shouldGetOutlet,
    shouldGetBranch,
    shouldGetPersonnel,
    shouldGetObjectives,
    shouldGetInStoreTasks,
    shouldGetPlanogram,
    shouldGetItemPrices,

    shouldGetDocuments,
    shouldGetContractYearly,

    shouldGetAlAlaliPromoEvaluation,
    shouldGetCompetitorPromoActivity,
    shouldGetShelfShare,
    shouldGetNewProductLaunch,

    shouldGetBrandingActivity,
    shouldGetBrandingAndDisplayReport,
    shouldGetCompetitorDisplayReport,
    shouldGetAchievementForm,
    shouldGetQuestionnary,
    shouldGetNotifications,
    shouldGetNotes,
    shouldGetOrigins,
    shouldGetAccessRoles,
];

module.exports = {
    shouldGetActivityList,
    shouldSyncActivityList,

    shouldGetLocation,
    shouldSyncLocation,

    shouldGetPersonnel,
    shouldSyncPersonnel,

    shouldGetObjectives,
    shouldSyncObjectives,

    shouldGetInStoreTasks,
    shouldSyncInStoreTasks,

    shouldGetPriceSurvey,
    shouldSyncPriceSurvey,

    shouldGetShelfShare,
    shouldSyncShelfShare,

    shouldGetPromotions,
    shouldSyncPromotions,

    shouldGetCurrentUser,

    shouldGetContractYearly,
    shouldSyncContractYearly,

    shouldGetContractSecondary,
    shouldSyncContractSecondary,

    shouldGetRetailSegment,
    shouldSyncRetailSegment,

    shouldGetOutlet,
    shouldSyncOutlet,

    shouldGetBranch,
    shouldSyncBranch,

    shouldGetBrandingActivity,
    shouldSyncBrandingActivity,

    shouldGetAchievementForm,
    shouldSyncAchievementForm,

    shouldGetCompetitorDisplayReport,
    shouldSyncCompetitorDisplayReport,

    shouldGetBrandingAndDisplayReport,
    shouldSyncBrandingAndDisplayReport,

    shouldGetNewProductLaunch,
    shouldSyncNewProductLaunch,

    shouldGetPlanogram,
    shouldSyncPlanogram,

    shouldGetItemPrices,
    shouldSyncItemPrices,

    shouldGetDocuments,
    shouldSyncDocuments,

    shouldGetAlAlaliPromoEvaluation,
    shouldSyncAlAlaliPromoEvaluation,

    shouldGetCompetitorPromoActivity,
    shouldSyncCompetitorPromoActivity,

    shouldGetQuestionnary,
    shouldSyncQuestionnary,

    shouldGetNotifications,
    shouldSyncNotifications,

    shouldGetNotes,
    shouldSyncNotes,

    shouldGetOrigins,
    shouldSyncOrigins,

    shouldGetAccessRoles,
    shouldSyncAccessRoles,

    getAllMeta,

    standardPack,
    merchandiserPack
};
