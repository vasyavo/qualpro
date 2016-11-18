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

describe('mobile synchronization', () => {

    before(function(done) {
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

    describe('Master Admin', () => {
        it('should get activity list', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/activityList')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync activity list', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/activityList/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get location', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/domain')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync location', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/domain/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get personnel', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/personnel')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync personnel', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/personnel/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        xit('should get objectives', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/objectives')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync objectives', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/objectives/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        xit('should get in store tasks', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/instoretasks')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync in store tasks', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/instoretasks/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get promotions', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/promotions')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync promotions', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/promotions/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get current user', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/personnel/currentUser')
                .expect(200);

            const user = resp.body;

            expect(user).to.be.an('Object');
            expect(user).to.have.property('_id');
        });

        it('should get contract yearly', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/contractsYearly')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync contract yearly', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/contractsYearly/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get contract secondary', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/contractsSecondary')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync contract secondary', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/contractsSecondary/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get retail segment', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/retailSegment')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync retail segment', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/retailSegment/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get outlet', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/outlet')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync outlet', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/outlet/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get branch', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/branch')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync branch', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/branch/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get branding and activity (in past branding and display)', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/brandingActivity')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync branding and activity (in past branding and display)', function *() {
            const resp = yield Authenticator.master
                .get('/mobile/brandingActivity/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        // todo price survey will be implemented later
    });

    describe('Country Admin', () => {
        it('country admin should pass authentication with password', function *() {
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

        it('should get activity list', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/activityList')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync activity list', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/activityList/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get location', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/domain')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync location', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/domain/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get personnel', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/personnel')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync personnel', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/personnel/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get objectives', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/objectives')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync objectives', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/objectives/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get in store tasks', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/instoretasks')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync in store tasks', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/instoretasks/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get promotions', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/promotions')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync promotions', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/promotions/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get current user', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/personnel/currentUser')
                .expect(200);

            const user = resp.body;

            expect(user).to.be.an('Object');
            expect(user).to.have.property('_id');
        });

        it('should get contract yearly', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/contractsYearly')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync contract yearly', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/contractsYearly/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get contract secondary', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/contractsSecondary')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync contract secondary', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/contractsSecondary/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get retail segment', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/retailSegment')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync retail segment', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/retailSegment/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get outlet', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/outlet')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync outlet', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/outlet/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get branch', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/branch')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync branch', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/branch/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get branding and activity (in past branding and display)', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/brandingActivity')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync branding and activity (in past branding and display)', function *() {
            const resp = yield Authenticator.countryAdmin
                .get('/mobile/brandingActivity/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        // todo price survey will be implemented later
    });

    xdescribe('Area Manager', () => {
        it('area manager should pass authentication with password', function *() {
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

        it('should get activity list', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/activityList')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync activity list', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/activityList/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get location', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/domain')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync location', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/domain/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get personnel', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/personnel')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync personnel', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/personnel/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get objectives', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/objectives')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync objectives', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/objectives/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get in store tasks', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/instoretasks')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync in store tasks', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/instoretasks/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get promotions', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/promotions')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync promotions', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/promotions/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get current user', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/personnel/currentUser')
                .expect(200);

            const user = resp.body;

            expect(user).to.be.an('Object');
            expect(user).to.have.property('_id');
        });

        it('should get contract yearly', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/contractsYearly')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync contract yearly', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/contractsYearly/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get contract secondary', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/contractsSecondary')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync contract secondary', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/contractsSecondary/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get retail segment', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/retailSegment')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync retail segment', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/retailSegment/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get outlet', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/outlet')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync outlet', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/outlet/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get branch', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/branch')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync branch', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/branch/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should get branding and activity (in past branding and display)', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/brandingActivity')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        it('should sync branding and activity (in past branding and display)', function *() {
            const resp = yield Authenticator.areaManager
                .get('/mobile/brandingActivity/sync')
                .expect(200);

            const body = resp.body;

            assertGetResponse(body);
        });

        // todo price survey will be implemented later
    });

});
