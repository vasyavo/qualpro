const expect = require('chai').expect;
const setup = require('./../testSetup.spec');
const request = require('supertest-as-promised');
const server = require('./../server');
const faker = require('faker');
const agent = request.agent(server);

/*
* Master admin can create master admin and country admin.
* Password will be delivered by SMS or email. CMS is initiator of this request.
* */

describe('mobile authentication', () => {

    // reserve super admin credentials
    const suEmail = faker.internet.email()
        .toLowerCase();
    const su = {
        login: suEmail,
        email: suEmail,
        pass: faker.lorem.words(1)
    };

    // reserve first user credentials
    const userEmail = faker.internet.email()
        .toLowerCase();
    const user = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: userEmail,
        pass: faker.lorem.words(1),
        phoneNumber: faker.random.number()
    };

    it('should fail authentication', function * () {
        const resp = yield request.agent(server)
            .post('/mobile/login')
            .send({})
            .expect(400);

        const body = resp.body;

        expect(body).to.be.an('Object');
    });

    it('should register super user', function * () {
        const resp = yield request(server)
            .post('/personnel/createSuper')
            .send(su)
            .expect(201);

        const body = resp.body;

        expect(body).to.be.a('String')
    });

    /*
    * Agent using here for persisting master admin session
    * */
    it('su should pass authentication successfully', function * () {
        const resp = yield agent
            .post('/mobile/login')
            .send(su)
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object');
    });

    /*
    * Master admin authenticated and performing request
    * */
    it.skip('su should register first user', function * () {
        const resp = yield agent
            .post('/personnel')
            .send(user)
            .expect(201);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    /*
    * Password wasn't sent to user at this stage
    * */
    it('user should fail his first authentication without password', function * () {
        const resp = yield request(server)
            .post('/mobile/login')
            .send({
                login: user.email
            })
            .expect(400);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

});
