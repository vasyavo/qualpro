const expect = require('chai').expect;
const async = require('async');
const setup = require('./../../testSetup.spec');
const request = require('supertest-as-promised');
const server = require('./../../server');
const faker = require('faker');
const shortId = require('shortid');
const Authenticator = require('./../../authenticator');

const assertGetResponse = (body) => {
    expect(body).to.be.an('Object');
    expect(body.data).to.be.an('Array');
};

const assertSynchResponse = (body) => {
    expect(body).to.be.an('Object')
        .and.include.all.keys(['data', 'total', 'lastSyncDate']);
    expect(body.data).to.be.an('Array');
    expect(body.total).to.be.a('Number');
    expect(body.lastSyncDate).to.be.a('String');
};

describe('mobile synchronization', () => {

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

        assertSynchResponse(body);
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

        assertSynchResponse(body);
    });

    xit('should get personnel', function *() {
        const resp = yield Authenticator.master
            .get('/mobile/personnel')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });

    xit('should sync personnel', function *() {
        const resp = yield Authenticator.master
            .get('/mobile/personnel/sync')
            .expect(200);

        const body = resp.body;

        assertSynchResponse(body);
    });

    it('should get objectives', function *() {
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

        assertSynchResponse(body);
    });

    it('should get in store tasks', function *() {
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

        assertSynchResponse(body);
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

        assertSynchResponse(body);
    });

    it('should get branding and display', function *() {
        const resp = yield Authenticator.master
            .get('/mobile/brandingAndDisplay')
            .expect(200);

        const body = resp.body;

        assertGetResponse(body);
    });

    it('should sync branding and display', function *() {
        const resp = yield Authenticator.master
            .get('/mobile/brandingAndDisplay/sync')
            .expect(200);

        const body = resp.body;

        assertSynchResponse(body);
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

        assertSynchResponse(body);
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

        assertSynchResponse(body);
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

        assertSynchResponse(body);
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

        assertSynchResponse(body);
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

        assertSynchResponse(body);
    });

    // todo price survey will be implemented later

});
