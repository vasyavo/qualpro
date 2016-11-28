const config = require('./../../config');
const expect = require('chai').expect;
const async = require('async');
const request = require('supertest-as-promised');
const server = require('./../../server');
const faker = require('faker');

describe('roles authentication possibility', () => {

    const demoPassword = '123456';

    it('should authenticate Salesman in app', function *() {
        const resp = yield request(server)
            .post('/mobile/login')
            .send({
                login: 'sm_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('should fails authenticate Salesman on desktop', function *() {
        const resp = yield request(server)
            .post('/login')
            .send({
                login: 'sm_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(403);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('should authenticate Cash van in app', function *() {
        const resp = yield request(server)
            .post('/mobile/login')
            .send({
                login: 'cv_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('should fails authenticate Cash van on desktop', function *() {
        const resp = yield request(server)
            .post('/login')
            .send({
                login: 'cv_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(403);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('should authenticate Merchandiser in app', function *() {
        const resp = yield request(server)
            .post('/mobile/login')
            .send({
                login: 'mc_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('should fails authenticate Merchandiser on desktop', function *() {
        const resp = yield request(server)
            .post('/login')
            .send({
                login: 'mc_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(403);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('should fails authenticate Master Uploader in app', function *() {
        const resp = yield request(server)
            .post('/mobile/login')
            .send({
                login: 'mu_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(403);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('should authenticate Master Uploader on desktop', function *() {
        const resp = yield request(server)
            .post('/login')
            .send({
                login: 'mu_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('should fails authenticate Country Uploader in app', function *() {
        const resp = yield request(server)
            .post('/mobile/login')
            .send({
                login: 'cu_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(403);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('should authenticate Country Uploader on desktop', function *() {
        const resp = yield request(server)
            .post('/login')
            .send({
                login: 'cu_uae@yopmail.com',
                pass: demoPassword
            })
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

});
