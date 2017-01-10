const expect = require('chai').expect;
const async = require('async');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const request = require('supertest-as-promised');
const server = require('./../app');
const faker = require('faker');
const agent = request.agent(server);
const Authenticator = require('./../authenticator');
const shortId = require('shortid');
const mailer = require('./../helpers/mailer');
const PasswordManager = require('./../helpers/passwordManager');
const oldPassGenerator = require('./../helpers/randomPass');
const AccessRolesCreator = require('./../modulesCreators/addModulesToAccessRoles');
const PositionModel = require('./../types/position/model');

/*
 * Master admin can create master admin and country admin.
 * Password will be delivered by SMS or email. CMS is initiator of this request.
 * */

describe('mobile authentication', () => {
    const posCountryManagerId = '574d547491e62ed9501ead77';
    
    before(function(done) {
        const positionCountryManager = {
            _id : posCountryManagerId,
            editedBy : {
                date : new Date('2016-05-31T09:08:04.469Z'),
                user : null
            },
            createdBy : {
                date : new Date('2016-05-31T09:08:04.469Z'),
                user : null
            },
            numberOfPersonnels : 0,
            groups : {
                group : [],
                users : [],
                owner : null
            },
            whoCanRW : 'owner',
            profileAccess : [],
            name : {
                en : 'COUNTRY MANAGER',
                ar : 'مدير سوق'
            }
        };

        async.waterfall([

            (cb) => {
                PositionModel.create(positionCountryManager, cb);
            }

        ], done.bind(null, null));
    });

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
        email: userEmail,
        phoneNumber: faker.random.number(),
        imageSrc: '',
        dateJoined: '2016-10-31T22:00:00.000Z',
        lastAccess: null,
        access: null,
        position: posCountryManagerId,
        vacation: {
            onLeave: false
        },
        archived: false,
        manager: null,
        retailSegment: [],
        outlet: [],
        country: [],
        region: [],
        subRegion: [],
        currentLanguage: 'en',
        firstName: {
            en: faker.name.firstName(),
            ar: ''
        },
        lastName: {
            en: faker.name.lastName(),
            ar: ''
        },
        branch: [],
        accessRoleLevel: 1
    };

    it('should fail authentication', function *() {
        const resp = yield request.agent(server)
            .post('/mobile/login')
            .send({})
            .expect(400);

        const body = resp.body;

        expect(body).to.be.an('Object');
    });

    it('should register super user', function *() {
        this.timeout(5000);
        const confirmNewUserRegistrationMailerSpy = this.sandbox.spy(mailer, 'confirmNewUserRegistration');

        const resp = yield request(server)
            .post('/personnel/createSuper')
            .send(su)
            .expect(201);

        const body = resp.body;

        expect(body).to.be.a('String');
        expect(confirmNewUserRegistrationMailerSpy).to.be.calledOnce;
    });

    /*
     * Agent using here for persisting master admin session
     * */
    it('su should pass authentication successfully', function *() {
        const resp = yield Authenticator.su
            .post('/mobile/login')
            .send(su)
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object');
    });

    /*
     * Master admin authenticated and performing request
     * */
    it('su should register master admin', function *() {
        user.accessRole = AccessRolesCreator.accessRoles[1].id;

        const resp = yield Authenticator.su
            .post('/personnel')
            .send(user)
            .expect(201);

        const body = resp.body;

        expect(body).to.be.an('Object');
        expect(body).to.have.property('_id')
            .and.to.be.a('String');

        // assign created user id to mock
        user.id = body._id;
    });

    /*
     * Password wasn't sent to user at this stage
     * */
    it('master should fail his first authentication without password', function *() {
        const resp = yield request(server)
            .post('/mobile/login')
            .send({
                login: user.email
            })
            .expect(400);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    /*
     * Master admin
     * */
    it('su should send generated password to new personnel', function *() {
        user.pass = PasswordManager.generatePassword();
        const generatePasswordStub = this.sandbox.stub(PasswordManager, 'generatePassword').returns(user.pass);

        user.token = shortId.generate();
        const generateTokenStub = this.sandbox.stub(oldPassGenerator, 'generate').returns(user.token);

        const resp = yield Authenticator.su
            .put(`/personnel/${user.id}`)
            .send({
                sendPass: true,
                type: 'email'
            })
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object');
        expect(body).to.have.property('_id', user.id);
        expect(generatePasswordStub).to.be.calledOnce
        expect(generateTokenStub).to.be.calledOnce
    });

    it('master should confirm registration', function *() {
        yield request(server)
            .get(`/personnel/confirm/${user.token}`)
            .send({})
            .expect(302);
    });

    it('master should pass authentication with password', function *() {
        const resp = yield Authenticator.master
            .post('/mobile/login')
            .send({
                login: user.email,
                pass: user.pass
            })
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('master should logout on mobile', function *() {
        const resp = yield Authenticator.master
            .get('/mobile/logout')
            .send({})
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('master should sign in on desktop', function *() {
        const resp = yield Authenticator.master
            .post('/login')
            .send({
                login: user.email,
                pass: user.pass
            })
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('master should logout on desktop', function *() {
        const resp = yield Authenticator.master
            .get('/logout')
            .send({})
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

    it('master should sign in with mobile app again', function *() {
        const resp = yield Authenticator.master
            .post('/mobile/login')
            .send({
                login: user.email,
                pass: user.pass
            })
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object')
    });

});
