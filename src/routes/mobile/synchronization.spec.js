const shell = require('shelljs');
const config = require('./../../config');
const spawnDefaults = require('./../../modulesCreators');
const expect = require('chai').expect;
const async = require('async');
const request = require('supertest-as-promised');
const server = require('./../../server');
const faker = require('faker');
const shortId = require('shortid');
const Authenticator = require('./../../authenticator');

const assertGetResponse = (body) => {
    expect(body).to.be.an('Object')
        .and.include.all.keys(['data', 'total', 'lastSyncDate']);
    expect(body.data).to.be.an('Array');
    expect(body.total).to.be.a('Number');
    expect(body.lastSyncDate).to.be.a('String');
};

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
            .get('/mobile/brandingActivity')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

function shouldSyncBrandingActivity(agent) {
    it('should sync branding activity (in past branding and display)', function *() {
        const resp = yield agent
            .get('/mobile/brandingActivity/sync')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });
}

describe('mobile synchronization', () => {

    describe('Master Admin', () => {

        shouldGetActivityList(Authenticator.master);

        shouldSyncActivityList(Authenticator.master);

        shouldGetLocation(Authenticator.master);

        shouldSyncLocation(Authenticator.master);

        shouldGetPersonnel(Authenticator.master);

        shouldSyncPersonnel(Authenticator.master);

        shouldGetObjectives(Authenticator.master);

        shouldSyncObjectives(Authenticator.master);

        shouldGetInStoreTasks(Authenticator.master);

        shouldSyncInStoreTasks(Authenticator.master);

        shouldGetPromotions(Authenticator.master);

        shouldSyncPromotions(Authenticator.master);

        shouldGetCurrentUser(Authenticator.master);

        shouldGetContractYearly(Authenticator.master);

        shouldSyncContractYearly(Authenticator.master);

        shouldGetContractSecondary(Authenticator.master);

        shouldSyncContractSecondary(Authenticator.master);

        shouldGetRetailSegment(Authenticator.master);

        shouldSyncRetailSegment(Authenticator.master);

        shouldGetOutlet(Authenticator.master);

        shouldSyncOutlet(Authenticator.master);

        shouldGetBranch(Authenticator.master);

        shouldSyncBranch(Authenticator.master);

        shouldGetBrandingActivity(Authenticator.master);

        shouldGetBrandingActivity(Authenticator.master);

        // todo price survey will be implemented later
    });

    describe('Staging database pulling', () => {

        it('should works', function(done) {
            const timeToPullDatabase = 60 * 10 * 1000;

            this.timeout(timeToPullDatabase);

            const pathToScript = `${config.workingDirectory}restore-staging-db.sh`;

            shell.chmod('+x', pathToScript);

            async.waterfall([

                (cb) => {
                    shell.exec(pathToScript, { async: true }, (code, stdout, stderr) => {
                        if (code !== 0) {
                            return cb('Something wrong with database pulling')
                        }

                        cb();
                    });
                },

                (cb) => {
                    spawnDefaults(cb);
                }

            ], (err) => {
                if (err) {
                    return done(err);
                }

                done();
            });
        });

    });

    describe('Country Admin', () => {

        it('should pass authentication with password', function *() {
            const resp = yield Authenticator.countryAdmin
                .post('/mobile/login')
                .send({
                    login: 'ca_uae@yopmail.com', //todo change to variables
                    pass: '123456'
                })
                .expect(200);

            const body = resp.body;

            expect(body).to.be.an('Object')
        });

        shouldGetActivityList(Authenticator.countryAdmin);

        shouldSyncActivityList(Authenticator.countryAdmin);

        shouldGetLocation(Authenticator.countryAdmin);

        shouldSyncLocation(Authenticator.countryAdmin);

        shouldGetPersonnel(Authenticator.countryAdmin);

        shouldSyncPersonnel(Authenticator.countryAdmin);

        shouldGetObjectives(Authenticator.countryAdmin);

        shouldSyncObjectives(Authenticator.countryAdmin);

        shouldGetInStoreTasks(Authenticator.countryAdmin);

        shouldSyncInStoreTasks(Authenticator.countryAdmin);

        shouldGetPromotions(Authenticator.countryAdmin);

        shouldSyncPromotions(Authenticator.countryAdmin);

        shouldGetCurrentUser(Authenticator.countryAdmin);

        shouldGetContractYearly(Authenticator.countryAdmin);

        shouldSyncContractYearly(Authenticator.countryAdmin);

        shouldGetContractSecondary(Authenticator.countryAdmin);

        shouldSyncContractSecondary(Authenticator.countryAdmin);

        shouldGetRetailSegment(Authenticator.countryAdmin);

        shouldSyncRetailSegment(Authenticator.countryAdmin);

        shouldGetOutlet(Authenticator.countryAdmin);

        shouldSyncOutlet(Authenticator.countryAdmin);

        shouldGetBranch(Authenticator.countryAdmin);

        shouldSyncBranch(Authenticator.countryAdmin);

        shouldGetBrandingActivity(Authenticator.countryAdmin);

        shouldGetBrandingActivity(Authenticator.countryAdmin);

        // todo price survey will be implemented later
    });

    describe('Area Manager', () => {
        it('should pass authentication with password', function *() {
            const resp = yield Authenticator.areaManager
                .post('/mobile/login')
                .send({
                    login: 'am_uae@yopmail.com', //todo change to variables
                    pass: '123456'
                })
                .expect(200);

            const body = resp.body;

            expect(body).to.be.an('Object')
        });

        shouldGetActivityList(Authenticator.areaManager);

        shouldSyncActivityList(Authenticator.areaManager);

        shouldGetLocation(Authenticator.areaManager);

        shouldSyncLocation(Authenticator.areaManager);

        shouldGetPersonnel(Authenticator.areaManager);

        shouldSyncPersonnel(Authenticator.areaManager);

        shouldGetObjectives(Authenticator.areaManager);

        shouldSyncObjectives(Authenticator.areaManager);

        shouldGetInStoreTasks(Authenticator.areaManager);

        shouldSyncInStoreTasks(Authenticator.areaManager);

        shouldGetPromotions(Authenticator.areaManager);

        shouldSyncPromotions(Authenticator.areaManager);

        shouldGetCurrentUser(Authenticator.areaManager);

        shouldGetContractYearly(Authenticator.areaManager);

        shouldSyncContractYearly(Authenticator.areaManager);

        shouldGetContractSecondary(Authenticator.areaManager);

        shouldSyncContractSecondary(Authenticator.areaManager);

        shouldGetRetailSegment(Authenticator.areaManager);

        shouldSyncRetailSegment(Authenticator.areaManager);

        shouldGetOutlet(Authenticator.areaManager);

        shouldSyncOutlet(Authenticator.areaManager);

        shouldGetBranch(Authenticator.areaManager);

        shouldSyncBranch(Authenticator.areaManager);

        shouldGetBrandingActivity(Authenticator.areaManager);

        shouldGetBrandingActivity(Authenticator.areaManager);

        // todo price survey will be implemented later
    });

});
