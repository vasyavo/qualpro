'use strict';

const expect = require('chai').expect;
const request = require('supertest-as-promised');
const server = require('./../server');
const faker = require('faker');
const agent = request.agent(server);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PersonnelModel = require('../types/personnel/model');


describe('feature: contactUs form', () => {
    const password = faker.lorem.words(1);
    const login = faker.internet.email().toLowerCase();
    const salt = bcrypt.genSaltSync(10);
    const user = {
        login : login,
        email : login,
        pass : bcrypt.hashSync(password, salt),
        super : true,
        confirmed : true
    };
    const contactUsForm = {
        type : faker.random.arrayElement([
            'Application Related Issue',
            'Future Application Ideas',
            'Others'
        ]),
        description : faker.lorem.paragraph()
    };

    before(function *() {
        yield Promise.all([
            PersonnelModel.collection.insert(user)
        ])
    });

    after(function *() {
        yield Promise.all([
            PersonnelModel.collection.remove({})
        ])
    });

    beforeEach(function *() {
        yield Promise.all([
            agent
                .post('/login')
                .send({
                    login : login,
                    pass : password
                }),
            agent
                .post('mobile/login')
                .send({
                    login : login,
                    pass : password
                })
        ]);
    });

    it('should get all existing contactUs form', function *() {
        const resp = yield agent
            .get('/contactUs')
            .send()
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object');
        expect(body).to.have.property('total', 0);
        expect(body).to.have.property('data');
        expect(body.data).to.be.an('Array');
    });

});
